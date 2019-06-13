import { hashBytes } from "./skein";


const CHARACTERS = {
  LOWER_CASE: "abcdefghijklmnopqrstuvwxyz",
  UPPER_CASE: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  NUMERIC: "0123456789",
  SPECIAL: "!\"#$%&'()*+,-./:;<=>>@[\\]^_`{|}~",
};

function generatePassword(seed, settings) {
  let i;
  let password = "";

  // Create a string of characters from which to build the password.
  let source_characters = (
    (settings.enableLowercase ? CHARACTERS.LOWER_CASE : "") +
    (settings.enableUppercase ? CHARACTERS.UPPER_CASE : "") +
    (settings.enableNumbers ? CHARACTERS.NUMERIC : "") +
    (settings.enableSymbols ? CHARACTERS.SPECIAL : "")
  );

  // Build the password character by character.
  for (i=0; i < settings.outputLength; i++) {
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
    password += source_characters[num % source_characters.length];

    // Update seed using lagged fibonacci generator.  See Wikipedia.  Values
    // borrowed from Knuth.  Using a 512 byte hash this step is really
    // unnecessary for passwords less than 64 characters long.
    seed.unshift(seed[24-1] ^ seed[55-1]);
    seed.pop();
  }

  return password;
};


function generate(details, settings) {
  // Build the string from which to obtain the hash used to generate the
  // password.
  let input = (
    details.hostname +
    details.username +
    details.password +
    "0"
  );

  // Hash the string to produce a seed for the password generator.
  var hash = hashBytes(new TextEncoder().encode(input));

  // Generate password from seed.
  var password = generatePassword(hash, settings);

  return password;
}

function onmessage(msg) {
  let password = generate(msg.data.details, msg.data.settings);
  postMessage(password);
}


const postMessage = <(any) => void> self.postMessage;
self.onmessage = onmessage;
