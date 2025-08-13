import ldap from 'ldapjs';

interface ADConfig {
  url: string;
  baseDN: string;
  bindDN?: string;
  bindPassword?: string;
  searchFilter?: string;
  tlsOptions?: any;
}

interface ADUser {
  username: string;
  displayName: string;
  email: string;
  department?: string;
  title?: string;
  groups?: string[];
}

export class ActiveDirectoryAuth {
  private config: ADConfig;

  constructor(config: ADConfig) {
    this.config = {
      searchFilter: '(sAMAccountName={{username}})',
      ...config
    };
  }

  /**
   * Authenticate user against Active Directory
   */
  async authenticate(
    username: string,
    password: string
  ): Promise<ADUser | null> {
    return new Promise((resolve, reject) => {
      const client = ldap.createClient({
        url: this.config.url,
        tlsOptions: this.config.tlsOptions
      });

      // Handle connection errors
      client.on('error', (err) => {
        client.unbind();
        reject(new Error(`LDAP connection error: ${err.message}`));
      });

      // Try to bind with user credentials
      const userDN = this.formatUserDN(username);

      client.bind(userDN, password, (bindErr) => {
        if (bindErr) {
          client.unbind();
          resolve(null); // Invalid credentials
          return;
        }

        // If bind successful, search for user details
        const searchFilter = this.config.searchFilter!.replace(
          '{{username}}',
          username
        );
        const searchOptions = {
          scope: 'sub' as const,
          filter: searchFilter,
          attributes: [
            'sAMAccountName',
            'displayName',
            'mail',
            'department',
            'title',
            'memberOf'
          ]
        };

        client.search(this.config.baseDN, searchOptions, (searchErr, res) => {
          if (searchErr) {
            client.unbind();
            reject(new Error(`LDAP search error: ${searchErr.message}`));
            return;
          }

          let user: ADUser | null = null;

          res.on('searchEntry', (entry) => {
            const attributes = entry.attributes;
            user = {
              username:
                this.getAttribute(attributes, 'sAMAccountName') || username,
              displayName:
                this.getAttribute(attributes, 'displayName') || username,
              email:
                this.getAttribute(attributes, 'mail') ||
                `${username}@company.local`,
              department: this.getAttribute(attributes, 'department'),
              title: this.getAttribute(attributes, 'title'),
              groups: this.getGroups(attributes)
            };
          });

          res.on('error', (err) => {
            client.unbind();
            reject(new Error(`LDAP search error: ${err.message}`));
          });

          res.on('end', () => {
            client.unbind();
            resolve(user);
          });
        });
      });
    });
  }

  /**
   * Format user DN for binding
   */
  private formatUserDN(username: string): string {
    // Check if username already contains domain
    if (username.includes('@')) {
      return username;
    }

    // Check if username is already a DN
    if (username.toLowerCase().includes('cn=')) {
      return username;
    }

    // If we have a bindDN pattern, use it
    if (this.config.bindDN) {
      return this.config.bindDN.replace('{{username}}', username);
    }

    // Default to UPN format
    const domain = this.extractDomain(this.config.baseDN);
    return `${username}@${domain}`;
  }

  /**
   * Extract domain from base DN
   */
  private extractDomain(baseDN: string): string {
    const dcParts = baseDN
      .split(',')
      .filter((part) => part.trim().toLowerCase().startsWith('dc='))
      .map((part) => part.split('=')[1]);
    return dcParts.join('.');
  }

  /**
   * Get attribute value from LDAP attributes
   */
  private getAttribute(attributes: any[], name: string): string | undefined {
    const attr = attributes.find((a) => a.type === name);
    return attr?.values?.[0];
  }

  /**
   * Extract group names from memberOf attribute
   */
  private getGroups(attributes: any[]): string[] {
    const memberOf = attributes.find((a) => a.type === 'memberOf');
    if (!memberOf) return [];

    return memberOf.values.map((dn: string) => {
      const cnMatch = dn.match(/CN=([^,]+)/i);
      return cnMatch ? cnMatch[1] : dn;
    });
  }
}

// Factory function to create AD auth instance from environment variables
export function createADAuth(): ActiveDirectoryAuth {
  const config: ADConfig = {
    url: process.env.LDAP_URL || 'ldap://dc.company.local:389',
    baseDN: process.env.LDAP_BASE_DN || 'DC=company,DC=local',
    bindDN: process.env.LDAP_BIND_DN, // Optional: 'DOMAIN\\{{username}}' or '{{username}}@domain.com'
    searchFilter:
      process.env.LDAP_SEARCH_FILTER || '(sAMAccountName={{username}})'
  };

  // Add TLS options if using LDAPS
  if (config.url.startsWith('ldaps://')) {
    config.tlsOptions = {
      rejectUnauthorized: process.env.LDAP_TLS_REJECT_UNAUTHORIZED !== 'false'
    };
  }

  return new ActiveDirectoryAuth(config);
}
