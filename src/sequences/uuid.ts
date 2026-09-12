import { TParameter } from '../types';

/**
 * Native UUID v7 generator.
 * Combines 48-bit timestamp with 80-bit randomness.
 */
function generateUUIDv7(): string {
	try {
		const timestamp = Date.now();
		const randomBytes = globalThis.crypto.getRandomValues(
			new Uint8Array(10),
		);

		randomBytes[0] = (randomBytes[0] & 0x0f) | 0x70; // version 7
		randomBytes[2] = (randomBytes[2] & 0x3f) | 0x80; // variant 10

		const hexTime = timestamp.toString(16).padStart(12, '0');
		const hexRand = Array.from(randomBytes)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');

		return `${hexTime.slice(0, 8)}-${hexTime.slice(8, 12)}-${hexRand.slice(0, 4)}-${hexRand.slice(4, 8)}-${hexRand.slice(8, 20)}`;
	} catch {
		return '00000000-0000-7000-8000-000000000000'; // fallback
	}
}

/**
 * Build the sequence function for UUID sequences.
 *
 * Supports v4 (default) and v7.
 * Formats: ~upper (uppercase), ~clean (no hyphens).
 *
 * @param input - Raw user input string.
 * @param parameter - Shared command context.
 * @returns A per-index function (i) => { stringFunction, stopFunction }.
 */
export function createUuidSeq(
	input: string,
	parameter: TParameter,
): (i: number) => { stringFunction: string; stopFunction: boolean } {
	const startMatch = input.match(parameter.segments['start_uuid']);

	let isV7 = false;
	let isUpper = false;
	let isClean = false;

	if (startMatch?.groups) {
		const version = startMatch.groups.uuidversion?.toLowerCase();
		if (version === 'v7' || version === '7') {
			isV7 = true;
		}

		const format = startMatch.groups.uuidformat?.toLowerCase() || '';
		if (format.includes('u')) {
			isUpper = true;
		}
		if (format.includes('c')) {
			isClean = true;
		}
	}

	return (i) => {
		let uuid = '';
		if (isV7) {
			uuid = generateUUIDv7();
		} else {
			uuid = globalThis.crypto.randomUUID();
		}

		if (isClean) {
			uuid = uuid.replace(/-/g, '');
		}

		if (isUpper) {
			uuid = uuid.toUpperCase();
		}

		// By default, stop after original selections length
		const stopExprResult = i >= parameter.origCursorPos.length;

		return {
			stringFunction: uuid,
			stopFunction: stopExprResult,
		};
	};
}
