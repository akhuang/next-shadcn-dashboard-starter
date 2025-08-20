# PowerShell 脚本 - 在域内 Windows 电脑上运行
Write-Host "=== Windows 域信息 ===" -ForegroundColor Green

# 获取域信息
$domain = [System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()
Write-Host "域名: $($domain.Name)"
Write-Host ""

# 获取域控制器列表
Write-Host "域控制器列表:" -ForegroundColor Yellow
foreach ($dc in $domain.DomainControllers) {
    Write-Host "  - 名称: $($dc.Name)"
    Write-Host "    IP地址: $($dc.IPAddress)"
    Write-Host "    站点: $($dc.SiteName)"
    Write-Host ""
}

# 获取 LDAP 基础 DN
$domainDN = "DC=" + $domain.Name.Replace(".", ",DC=")
Write-Host "LDAP Base DN: $domainDN" -ForegroundColor Yellow
Write-Host ""

# 生成配置建议
Write-Host "=== 建议的 .env 配置 ===" -ForegroundColor Green
Write-Host "# 使用第一个域控制器"
Write-Host "LDAP_URL=ldap://$($domain.DomainControllers[0].Name):389"
Write-Host "LDAP_BASE_DN=$domainDN"
Write-Host ""
Write-Host "# 或使用域名（推荐，自动负载均衡）"
Write-Host "LDAP_URL=ldap://$($domain.Name):389"
Write-Host "LDAP_BASE_DN=$domainDN"