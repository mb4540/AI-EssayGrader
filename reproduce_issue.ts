
import { findTextLocation } from './src/lib/annotations/lineNumbers';

const multiLineText = `Line one has text.
Line two has more text.
Line three continues.`;

console.log("--- Multi-line Text Test ---");
const result1 = findTextLocation(multiLineText, 'Line two', 2);
console.log('Result for "Line two" at line 2:', result1);

const textWithSpecialChars = 'This has "quotes" and (parentheses) and [brackets].';
console.log("\n--- Special Chars Test ---");
const result2 = findTextLocation(textWithSpecialChars, '"quotes"', 1);
console.log('Result for "quotes" at line 1:', result2);

const longQuote = 'This is a test essay about literature and writing';
const sampleText = `This is a test essay about literature and writing.
It contains multiple sentences.`;
console.log("\n--- Long Quote Test ---");
const result3 = findTextLocation(sampleText, longQuote, 1);
console.log('Result for long quote at line 1:', result3);
