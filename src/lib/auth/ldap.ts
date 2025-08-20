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

      // Determine bind DN and password
      // If bindDN is provided in config, use it for initial bind (service account)
      // Otherwise, bind directly with user credentials
      const isServiceAccountBind =
        this.config.bindDN && this.config.bindPassword;
      const bindDN = isServiceAccountBind
        ? this.config.bindDN
        : this.formatUserDN(username);
      const bindPassword = isServiceAccountBind
        ? this.config.bindPassword
        : password;

      // Try to bind
      client.bind(bindDN!, bindPassword!, (bindErr) => {
        if (bindErr) {
          client.unbind();
          resolve(null); // Invalid credentials
          return;
        }

        // If using service account, need to verify user password separately
        if (isServiceAccountBind) {
          const userDN = this.formatUserDN(username);
          client.bind(userDN, password, (userBindErr) => {
            if (userBindErr) {
              client.unbind();
              resolve(null); // Invalid user credentials
              return;
            }
            // Continue to search for user details
            this.searchUserDetails(client, username, resolve, reject);
          });
        } else {
          // Already bound with user credentials, search for details
          this.searchUserDetails(client, username, resolve, reject);
        }
      });
    });
  }

  /**
   * Search for user details in LDAP
   */
  private searchUserDetails(
    client: any,
    username: string,
    resolve: (value: ADUser | null) => void,
    reject: (reason?: any) => void
  ): void {
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
        'memberOf',
        'cn',
        'uid'
      ]
    };

    client.search(
      this.config.baseDN,
      searchOptions,
      (searchErr: any, res: any) => {
        if (searchErr) {
          client.unbind();
          reject(new Error(`LDAP search error: ${searchErr.message}`));
          return;
        }

        let user: ADUser | null = null;

        res.on('searchEntry', (entry: any) => {
          const attributes = entry.attributes;
          user = {
            username:
              this.getAttribute(attributes, 'sAMAccountName') ||
              this.getAttribute(attributes, 'uid') ||
              this.getAttribute(attributes, 'cn') ||
              username,
            displayName:
              this.getAttribute(attributes, 'displayName') ||
              this.getAttribute(attributes, 'cn') ||
              username,
            email:
              this.getAttribute(attributes, 'mail') ||
              `${username}@${this.extractDomain(this.config.baseDN)}`,
            department: this.getAttribute(attributes, 'department'),
            title: this.getAttribute(attributes, 'title'),
            groups: this.getGroups(attributes)
          };
        });

        res.on('error', (err: any) => {
          client.unbind();
          reject(new Error(`LDAP search error: ${err.message}`));
        });

        res.on('end', () => {
          client.unbind();
          resolve(user);
        });
      }
    );
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

    // For Huawei domain, support direct username binding
    // This allows authentication without specifying a full DN
    if (!this.config.bindDN || this.config.bindDN === '') {
      // If no bindDN specified, try common formats
      // First try UPN format
      const domain = this.extractDomain(this.config.baseDN);
      return `${username}@${domain}`;
    }

    // If we have a bindDN pattern, use it
    if (this.config.bindDN.includes('{{username}}')) {
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
    bindDN: process.env.LDAP_BIND_DN || undefined, // Support empty/blank for user self-bind
    bindPassword: process.env.LDAP_BIND_PASSWORD || undefined,
    searchFilter:
      process.env.LDAP_SEARCH_FILTER ||
      '(|(sAMAccountName={{username}})(uid={{username}})(cn={{username}}))'
  };

  // Log debug info if enabled
  if (process.env.LDAP_DEBUG === 'true') {
    console.log('LDAP Configuration:', {
      url: config.url,
      baseDN: config.baseDN,
      bindDN: config.bindDN ? 'configured' : 'user self-bind',
      searchFilter: config.searchFilter
    });
  }

  // Add TLS options if using LDAPS
  if (config.url.startsWith('ldaps://')) {
    config.tlsOptions = {
      rejectUnauthorized: process.env.LDAP_TLS_REJECT_UNAUTHORIZED !== 'false'
    };
  }

  return new ActiveDirectoryAuth(config);
}
