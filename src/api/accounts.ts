import { decryptAES256 } from '../utils/crypto'
import { getAppDataSync } from '../utils/appDataLoader'

/** 演示账号（密码以 AES-256 密文存于数据源，加载时解密） */
export interface DemoAccount {
  id: string
  username: string
  password_encrypted: string
  /** 解密后的密码（仅内存态） */
  password?: string
  name: string
  role: string
  organization: string | null
  phone: string
}

/** 读取全部演示账号（内存态自动解密密码） */
export function getDemoAccountsSync(): DemoAccount[] {
  const data = getAppDataSync()
  return (data?.demo_accounts ?? []).map((account) => ({
    ...account,
    password: decryptAES256(account.password_encrypted),
  }))
}
