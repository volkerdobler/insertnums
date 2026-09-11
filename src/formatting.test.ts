import { formatString, formatTemporalDateTime } from './formatting';
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
assertEqual(plainRndNoToken, null, 'plain rnd does not match start_randomToken');

const plainHexNoToken = 'hex'.match(new RegExp(rules.start_randomToken, 'i'));
assertEqual(plainHexNoToken, null, 'plain hex does not match start_randomToken');

// 3. Hex numbers (0x1A) must NOT match start_randomToken
const hexNumNoToken = '0x1A'.match(new RegExp(rules.start_randomToken, 'i'));
assertEqual(hexNumNoToken, null, '0x1A does not match start_randomToken');

console.log('random token tests passed');
