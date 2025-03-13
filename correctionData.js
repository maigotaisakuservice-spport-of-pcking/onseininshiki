// correctionData.js
// 100種類の自動修正ルールを定義（各パターンは文字列として定義）
const correctionRules = [
  { pattern: "\\s{2,}", replacement: " " },
  { pattern: "\\n", replacement: " " },
  { pattern: "([ぁ-ん]+)、([ぁ-ん]+)", replacement: "$1$2" },
  { pattern: "は、ひふへほ", replacement: "はひふへほ" },
  { pattern: "、{2,}", replacement: "、" },
  { pattern: "。{2,}", replacement: "。" },
  { pattern: "！{2,}", replacement: "！" },
  { pattern: "？{2,}", replacement: "？" },
  { pattern: "(\\d+)\\s+(\\d+)", replacement: "$1,$2" },
  { pattern: "ａｂｃ", replacement: "abc" },
  { pattern: "てて", replacement: "って" },
  { pattern: "すす", replacement: "す" },
];
