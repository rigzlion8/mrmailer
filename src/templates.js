function formatPreview({ subject, body, to }) {
return [
"```\nPREVIEW",
`To: ${to}`,
`Subject: ${subject}`,
"",
body,
"```"
].join("\n");
}


module.exports = { formatPreview };