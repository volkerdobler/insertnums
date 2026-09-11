import {
	formatString,
	formatTemporalDateTime,
	formatNumber,
	toRoman,
} from './formatting';
import { Temporal } from 'temporal-polyfill';
import { getRegExpressions } from './components/evaluator';

function assertEqual(a: any, b: any, msg?: string) {
	if (a !== b) {
		throw new Error(`Assertion failed: ${a} !== ${b}. ${msg || ''}`);
	}
}

// Basic padding right (default right-align)
assertEqual(formatString('42', '#<5'), '42###', 'left-align with #'); // left-align with '#'
assertEqual(formatString('42', '>5'), '   42', 'right-align with space'); // right-align with spaces
assertEqual(formatString('42', '0>5'), '00042', 'right-align with 0'); // right-align with '0'

// center
assertEqual(formatString('x', '-=5'), '--x--', 'center 5 width');
assertEqual(
	formatString('x', '-=6'),
	'--x---',
	'center 6 width - default left bias',
);
assertEqual(formatString('x', '-=6l'), '--x---', 'center 6 width - left bias');
assertEqual(formatString('x', '-=6r'), '---x--', 'center 6 width - right bias');
assertEqual(formatString('xx', '-=6r'), '--xx--', 'center 6 width - exactly');

// width less than value -> no padding
assertEqual(
	formatString('abcdef', '3'),
	'abcdef',
	'no padding when width < value length',
);

// w flag -> last char
assertEqual(
	formatString('hello', '>10w'),
	'         o',
	'last char with w flag - hello',
);
assertEqual(formatString('hi', '#<5w'), 'i####', 'last char with w flag - hi');

console.log('formatting tests passed');

// Date & Time formatting tests
const dt = Temporal.PlainDateTime.from('2026-03-09T14:30:15');
assertEqual(
	formatTemporalDateTime(dt, 'yyyy-MM-dd HH:mm:ss'),
	'2026-03-09 14:30:15',
	'full datetime token test',
);
assertEqual(
	formatTemporalDateTime(dt, 'iso'),
	'2026-03-09T14:30:15',
	'iso format test',
);
assertEqual(
	formatTemporalDateTime(dt, 'utc'),
	'2026-03-09T14:30:15Z',
	'utc format test',
);
assertEqual(
	formatTemporalDateTime(dt, 'epoch'),
	'1773066615',
	'epoch timestamp test',
);

console.log('date-time formatting tests passed');

// Evaluator date parsing test
const rules = getRegExpressions();
const m1 = '%14:00'.match(new RegExp(rules.start_date, 'i'));
assertEqual(m1?.groups?.start, '14:00', '14:00 start time extracted');

const m3 = '%3:03 :15min'.match(new RegExp(rules.start_date, 'i'));
assertEqual(m3?.groups?.start, '3:03', '3:03 extracted from %3:03 :15min');

const s3 = '%14:00:1d15min'.match(new RegExp(rules.steps_date, 'i'));
assertEqual(s3?.groups?.step_expr, '1d15min', '1d15min step_expr extracted');

console.log('date-time evaluator parsing tests passed');

// Random token regex parsing tests
const rnd1 = ':rnd:12'.match(new RegExp(rules.start_randomToken, 'i'));
assertEqual(rnd1?.groups?.tokenType, ':rnd', ':rnd tokenType matched');
assertEqual(rnd1?.groups?.tokenLength, '12', '12 length matched');

const rnd2 = 'rnd:16'.match(new RegExp(rules.start_randomToken, 'i'));
assertEqual(rnd2?.groups?.tokenType, 'rnd:', 'rnd: tokenType matched');
assertEqual(rnd2?.groups?.tokenLength, '16', '16 length matched');

const hex1 = ':hex:32'.match(new RegExp(rules.start_randomToken, 'i'));
assertEqual(hex1?.groups?.tokenType, ':hex', ':hex tokenType matched');
assertEqual(hex1?.groups?.tokenLength, '32', '32 length matched');

const pwd1 = ':pwd:20'.match(new RegExp(rules.start_randomToken, 'i'));
assertEqual(pwd1?.groups?.tokenType, ':pwd', ':pwd tokenType matched');
assertEqual(pwd1?.groups?.tokenLength, '20', '20 length matched');

// Collision safety tests!
// 1. Decimal random numbers (e.g. 1r5) MUST match start_decimal and NOT start_randomToken
const decRnd = '1r5'.match(new RegExp(rules.start_decimal, 'i'));
assertEqual(decRnd?.groups?.start, '1', '1r5 start is 1');
assertEqual(decRnd?.groups?.rndNumber, '5', '1r5 rndNumber is 5');
const decRndNoToken = '1r5'.match(new RegExp(rules.start_randomToken, 'i'));
assertEqual(decRndNoToken, null, '1r5 does not match start_randomToken');

// 2. Plain words "rnd" and "hex" without colon MUST match start_alpha and NOT start_randomToken
const plainRndNoToken = 'rnd'.match(new RegExp(rules.start_randomToken, 'i'));
assertEqual(
	plainRndNoToken,
	null,
	'plain rnd does not match start_randomToken',
);

const plainHexNoToken = 'hex'.match(new RegExp(rules.start_randomToken, 'i'));
assertEqual(
	plainHexNoToken,
	null,
	'plain hex does not match start_randomToken',
);

// 3. Hex numbers (0x1A) must NOT match start_randomToken
const hexNumNoToken = '0x1A'.match(new RegExp(rules.start_randomToken, 'i'));
assertEqual(hexNumNoToken, null, '0x1A does not match start_randomToken');

console.log('random token tests passed');

// Roman numeral formatting tests
assertEqual(toRoman(1), 'I', '1 is I');
assertEqual(toRoman(4), 'IV', '4 is IV');
assertEqual(toRoman(9), 'IX', '9 is IX');
assertEqual(toRoman(14), 'XIV', '14 is XIV');
assertEqual(toRoman(40), 'XL', '40 is XL');
assertEqual(toRoman(90), 'XC', '90 is XC');
assertEqual(toRoman(1999), 'MCMXCIX', '1999 is MCMXCIX');
assertEqual(toRoman(2026), 'MMXXVI', '2026 is MMXXVI');
assertEqual(toRoman(14, true), 'xiv', '14 is xiv in lowercase');
assertEqual(toRoman(4, true), 'iv', '4 is iv in lowercase');

assertEqual(formatNumber(14, 'R'), 'XIV', 'formatNumber 14 R');
assertEqual(formatNumber(14, 'r'), 'xiv', 'formatNumber 14 r');
assertEqual(formatNumber(14, 'roman'), 'XIV', 'formatNumber 14 roman');
assertEqual(formatNumber(4, '>5R'), '   IV', 'formatNumber 4 >5R with padding');

const formatRomanMatch = '1~R'.match(new RegExp(rules.format_decimal, 'i'));
assertEqual(
	formatRomanMatch?.groups?.type,
	'R',
	'1~R matches format_decimal type R',
);

const formatRomanLowerMatch = '1~r'.match(
	new RegExp(rules.format_decimal, 'i'),
);
assertEqual(
	formatRomanLowerMatch?.groups?.type,
	'r',
	'1~r matches format_decimal type r',
);

console.log('roman numeral tests passed');
