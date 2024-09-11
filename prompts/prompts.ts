export const SUMMARY_CHARACTERS_PROMPT = `
列出所有文件中提到的角色的姓名, 描述與性格, 如果在文件中沒提及就說文件中沒有提及
不需要總結

列出的格式使用JSON格式如下:

{
  "characters": [
    {
      "name": "角色名稱",
      "description": "角色描述",
      "personality": "角色性格"
    }
  ]
}
`
