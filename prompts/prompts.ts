export const SUMMARY_CHARACTERS_PROMPT = `
List all characters mentioned in the document, including their names, descriptions, and personalities. If not mentioned in the document, state that it's not mentioned.
No summary is needed.

Return in JSON format.

Use the following JSON format for the list:

{
  "characters": [
    {
      "name": "Character name",
      "description": "Character description",
      "personality": "Character personality"
    }
  ]
}

Please return only plain text format, do not use markdown format.
`
