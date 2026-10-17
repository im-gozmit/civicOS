// The words and buttons of the WhatsApp bot's welcome menu.
// WhatsApp limits: at most 3 reply buttons, a button title of 20 characters, a body of 1024 characters.

export interface MenuButton {
  id: "REPORT" | "MY_COMPLAINTS" | "HOW_IT_WORKS";
  title: string;
}

export const BTN_REPORT: MenuButton = { id: "REPORT", title: "📸 Report a problem" };
export const BTN_MINE: MenuButton = { id: "MY_COMPLAINTS", title: "🔎 My complaints" };
export const BTN_HOW: MenuButton = { id: "HOW_IT_WORKS", title: "ℹ️ How it works" };

export const WELCOME_BUTTONS: MenuButton[] = [BTN_REPORT, BTN_MINE, BTN_HOW];
export const WELCOME_HEADER = "Sudhaar · सुधार";
export const WELCOME_FOOTER = "Free · No app · No sign-up";

/** Keeps only a plain first name from the WhatsApp profile name (it is typed by the user, so it is cleaned). */
export function cleanProfileName(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const first = raw.trim().split(/\s+/)[0] ?? "";
  const letters = first.replace(/[^\p{L}\p{M}'-]/gu, "");
  return letters.length >= 2 && letters.length <= 20 ? letters : "";
}

export function welcomeBody(name = ""): string {
  const who = name ? `, ${name}` : "";
  return (
    `🙏 Namaste${who}! Welcome to *Sudhaar*.\n\n` +
    "A pothole, a heap of garbage, a blocked drain, a street light that stays dark: these things trouble real people every single day, " +
    "and you should not have to run from office to office to get them fixed. We are here to listen, and to help.\n\n" +
    "It takes about a minute. Send a photo, share the location, and you get a complaint number you can follow until the problem is fixed.\n\n" +
    "What would you like to do?\n\n" +
    `🙏 नमस्ते${who}! *सुधार* में आपका स्वागत है। गड्ढे, कचरा, बंद नाली या खराब स्ट्रीट लाइट रोज़ आपका समय और सुकून छीनती हैं। ` +
    "समस्या की फ़ोटो भेजें और लोकेशन बताएं, आगे का काम हम संभालेंगे।"
  );
}

/** Plain-text version of the welcome, used if WhatsApp refuses the buttons. */
export function welcomeText(name = ""): string {
  return (
    welcomeBody(name) +
    "\n\n• To report: send a *photo*, then share the *location* (📎 > Location).\n" +
    "• To check a complaint: send *status CIV-000123* or *my complaints*."
  );
}

export const REPORT_PROMPT =
  "📸 Okay, let's get this fixed. Please send a *photo* of the problem now. A few words, or a voice note, about what is wrong helps a lot.\n" +
  "Then share the location (📎 > Location).\n\n" +
  "ठीक है। अब समस्या की *फ़ोटो* भेजिए, फिर लोकेशन शेयर कीजिए।";

export const HOW_IT_WORKS =
  "Here is how it works:\n" +
  "1️⃣ Send a photo of the problem. A short caption or a voice note helps.\n" +
  "2️⃣ Share the location (📎 > Location).\n" +
  "3️⃣ You get a complaint number and a private link to follow it.\n" +
  "4️⃣ Staff check it, and we message you here at every step until it is fixed.\n\n" +
  "Your photo and location are used only for this complaint. This is a demo service: nothing is dispatched without a person.\n\n" +
  "यह ऐसे काम करता है: फ़ोटो भेजें, लोकेशन बताएं, शिकायत नंबर पाएं, और हर कदम की जानकारी यहीं मिलेगी।";

