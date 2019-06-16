import { hashBytes } from "./skein";

const CHARACTERS = {
  LOWER_CASE: "abcdefghijklmnopqrstuvwxyz",
  NUMERIC: "0123456789",
  SPECIAL: "!\"#$%&'()*+,-./:;<=>>@[\\]^_`{|}~",
  UPPER_CASE: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
};

function generatePassword(seed, settings) {
  // tslint:disable:no-bitwise
  let i;
  let password = "";

  // Create a string of characters from which to build the password.
  const sourceCharacters = (
    (settings.enableLowercase ? CHARACTERS.LOWER_CASE : "") +
    (settings.enableUppercase ? CHARACTERS.UPPER_CASE : "") +
    (settings.enableNumbers ? CHARACTERS.NUMERIC : "") +
    (settings.enableSymbols ? CHARACTERS.SPECIAL : "")
  );

  // Build the password character by character.
  for (i = 0; i < settings.outputLength; i++) {
    // Generate a 24 bit random number from from first three bytes of seed */
    // Because of the way bitwise operators are handled in javascript, larger
    // numbers will cause issues.
    let num = (
      (seed[0] << 0) +
      (seed[1] << 8) +
      (seed[2] << 16)
    );

    // The seed is altered when the length is changed because it looks
    // better, but doing so should make no difference to security.
    num += settings.outputLength;

    // Select character from those available.
    password += sourceCharacters[num % sourceCharacters.length];

    // Update seed using lagged fibonacci generator.  See Wikipedia.  Values
    // borrowed from Knuth.  Using a 512 byte hash this step is really
    // unnecessary for passwords less than 64 characters long.
    seed.unshift(seed[24 - 1] ^ seed[55 - 1]);
    seed.pop();
  }

  return password;
  // tslint:enable:no-bitwise
}

function generate(details, settings) {
  // Build the string from which to obtain the hash used to generate the
  // password.
  const input = (
    details.hostname +
    details.username +
    details.password +
    "0"
  );

  // Hash the string to produce a seed for the password generator.
  const hash = hashBytes(new TextEncoder().encode(input));

  // Generate password from seed.
  const password = generatePassword(hash, settings);

  return password;
}

function onmessage(msg) {
  const password = generate(msg.data.details, msg.data.settings);
  postMessage(password);
}

// tslint:disable-next-line:variable-name
const postMessage = self.postMessage as (any) => void;
self.onmessage = onmessage;
