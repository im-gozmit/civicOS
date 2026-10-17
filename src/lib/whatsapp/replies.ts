import { CATEGORY_LABEL_HI, SEVERITY_LABEL_HI, STATUS_LABEL_HI, TEAM_LABEL_HI } from "@/lib/hindi";
import { bilingual as bi } from "@/lib/notificationText";
import { STATUS_LABEL } from "@/lib/transitions";
import { teamIdFromLabel } from "@/lib/teams";
import type { Category, Complaint, ComplaintStatus, Severity } from "@/lib/types";

// Everything the bot says, in English and Hindi. Messages that have a tracking link send it as a tap button
// (sendLinkButton), so none of these texts contains a web address.

const CATEGORY_EN: Record<Category, string> = {
  ROAD_DAMAGE: "Road damage",
  GARBAGE: "Garbage",
  DRAINAGE: "Drainage",
  WATER_SUPPLY: "Water supply",
  STREET_LIGHT: "Street light",
  OTHER: "Other / to be reviewed",
};

const trim = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);
const sentence = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** The "complaint registered" message. WhatsApp allows 1024 characters with a button, so long parts are shortened. */
export function successText(c: Complaint): string {
  // Fits WhatsApp's 1024 characters for a button message: the long, free-text parts shrink until it fits.
  for (const [summaryMax, voiceMax] of [[150, 100], [100, 60], [70, 0], [40, 0]] as const) {
    const text = buildSuccess(c, summaryMax, voiceMax);
    if (text.length <= 1000) return text;
  }
  return buildSuccess(c, 40, 0);
}

function buildSuccess(c: Complaint, summaryMax: number, voiceMax: number): string {
  const teamId = c.assignment?.suggestedTeam ? (c.assignment.suggestedTeam as keyof typeof TEAM_LABEL_HI) : teamIdFromLabel(c.queue);
  const similar = (c.duplicateCandidates?.length ?? 0) > 0;
  const en =
    `✅ Complaint registered: *${c.ticketId}*\n` +
    `Issue: ${CATEGORY_EN[c.category]}\n` +
    `Suggested team: ${c.queue}\n` +
    `Severity (suggested): ${sentence(c.severity)}\n` +
    `Summary: ${trim(c.summary, summaryMax)}\n` +
    (c.voice && voiceMax > 0 ? `Voice note (as we understood it): ${trim(c.voice.english, voiceMax)}\n` : "") +
    (similar ? "ℹ️ A similar problem was reported nearby; staff will link them if it is the same.\n" : "") +
    "Status: received, awaiting staff review. Staff confirm the team, and we message you here when they do.\n" +
    (c.needsHumanReview ? "A person will review this report.\n" : "") +
    `Tap the button to follow it, or send *status ${c.ticketId}* anytime.`;
  const hi =
    `✅ शिकायत दर्ज हो गई: *${c.ticketId}*\n` +
    `समस्या: ${CATEGORY_LABEL_HI[c.category]}\n` +
    `सुझाई गई टीम: ${TEAM_LABEL_HI[teamId]}\n` +
    `गंभीरता (सुझाव): ${SEVERITY_LABEL_HI[c.severity as Severity]}\n` +
    (similar ? "ℹ️ पास में मिलती-जुलती समस्या दर्ज है; एक जैसी होने पर स्टाफ दोनों को जोड़ेगा।\n" : "") +
    "स्थिति: प्राप्त, स्टाफ समीक्षा बाकी। टीम की पुष्टि स्टाफ करेगा और होते ही हम यहीं संदेश भेजेंगे।\n" +
    (c.needsHumanReview ? "कोई व्यक्ति इस रिपोर्ट की समीक्षा करेगा।\n" : "") +
    `स्थिति देखने के लिए बटन दबाएं, या कभी भी *status ${c.ticketId}* भेजें।`;
  return bi(en, hi);
}

export const R = {
  photoDownloadFailed: bi("Sorry, I couldn't download that photo. Please try sending it again.", "माफ़ कीजिए, यह फ़ोटो डाउनलोड नहीं हो सकी। कृपया दोबारा भेजिए।"),
  photoAdded: bi("Added this photo to your report. Please share the location to finish.", "यह फ़ोटो आपकी रिपोर्ट में जोड़ दी गई है। पूरा करने के लिए लोकेशन शेयर कीजिए।"),
  gotPhoto: bi("📸 Got your photo.", "📸 आपकी फ़ोटो मिल गई।"),
  gotLocation: bi("📍 Got the location. Now send a photo of the problem within 10 minutes.", "📍 लोकेशन मिल गई। अब 10 मिनट के भीतर समस्या की फ़ोटो भेजिए।"),
  voiceNeedsPhoto: bi("🎙️ Voice notes can be added to a report. Please send a photo of the problem first.", "🎙️ वॉइस नोट रिपोर्ट में जोड़ा जा सकता है। पहले समस्या की फ़ोटो भेजिए।"),
  voiceDownloadFailed: bi("I couldn't download that voice note. Please share the location to finish your report.", "यह वॉइस नोट डाउनलोड नहीं हो सका। रिपोर्ट पूरी करने के लिए लोकेशन शेयर कीजिए।"),
  voiceAdded: bi("🎙️ Got your voice note and added it. Please share the location to finish.", "🎙️ आपका वॉइस नोट मिल गया और जोड़ दिया गया। पूरा करने के लिए लोकेशन शेयर कीजिए।"),
  voiceOrphan: bi("I got your voice note, but there is no report waiting any more. Please send the photo again.", "वॉइस नोट मिला, पर अब कोई रिपोर्ट इंतज़ार में नहीं है। कृपया फ़ोटो फिर से भेजिए।"),
  noted: bi("Noted. Please share the location (📎 > Location) to finish your report.", "ठीक है। रिपोर्ट पूरी करने के लिए लोकेशन (📎 > Location) शेयर कीजिए।"),
  onlyMedia: bi(
    "I can only read photos, voice notes, locations and text. Please send a photo of the problem.",
    "मैं फ़ोटो, वॉइस नोट, लोकेशन और टेक्स्ट ही पढ़ सकता हूँ। कृपया समस्या की फ़ोटो भेजिए।",
  ),
  analysingPhoto: bi("🔎 Analysing your photo, this takes about 15 seconds…", "🔎 आपकी फ़ोटो की जाँच हो रही है, इसमें लगभग 15 सेकंड लगेंगे…"),
  analysingPhotoVoice: bi("🔎 Analysing your photo and voice note. This can take up to a minute…", "🔎 आपकी फ़ोटो और वॉइस नोट की जाँच हो रही है। इसमें एक मिनट तक लग सकता है…"),
  unusable: bi("That photo is too unclear to use. Please send a clearer photo of the problem.", "यह फ़ोटो इस्तेमाल करने के लिए बहुत धुंधली है। कृपया समस्या की साफ़ फ़ोटो भेजिए।"),
  trackFailed: bi(
    "I could not link that complaint. Check you sent the whole message from the website; it may already be linked.",
    "यह शिकायत जोड़ी नहीं जा सकी। जाँच लीजिए कि आपने वेबसाइट से पूरा संदेश भेजा है; हो सकता है वह पहले से जुड़ी हो।",
  ),
  statusNotFound: bi(
    "I couldn't find that complaint for this number. Check the ID, or send *my complaints*.",
    "इस नंबर के लिए वह शिकायत नहीं मिली। नंबर जाँच लीजिए, या *my complaints* भेजिए।",
  ),
  noComplaints: bi(
    "You have not reported anything yet. Whenever you are ready, send me a photo of the problem and we will take it from there.",
    "आपने अभी तक कोई समस्या दर्ज नहीं की है। जब चाहें, समस्या की फ़ोटो भेजिए, आगे हम संभाल लेंगे।",
  ),
  notCivic: (seen: string) =>
    bi(
      "I could not see a public civic problem in that photo, so I did not register a complaint.\n" +
        `What I saw: ${trim(seen, 200)}\n\n` +
        "Please send a clear photo of the problem (pothole, garbage, blocked drain, water leak, broken street light).",
      "इस फ़ोटो में कोई सार्वजनिक समस्या नहीं दिखी, इसलिए शिकायत दर्ज नहीं हुई। कृपया समस्या की साफ़ फ़ोटो भेजिए (गड्ढा, कचरा, बंद नाली, पानी का रिसाव, खराब स्ट्रीट लाइट)।",
    ),
  trackOn: (ticketId: string) =>
    bi(
      `✅ WhatsApp updates are on for ${ticketId}. We will message you when staff update it.`,
      `✅ ${ticketId} के लिए WhatsApp अपडेट चालू हो गए हैं। स्टाफ के अपडेट करते ही हम आपको संदेश भेजेंगे।`,
    ),
  statusLine: (c: Pick<Complaint, "ticketId" | "status" | "title">) =>
    bi(`${c.ticketId}: ${STATUS_LABEL[c.status as ComplaintStatus]}\n${c.title}`, `${c.ticketId}: ${STATUS_LABEL_HI[c.status as ComplaintStatus]}`),
  complaintList: (list: Array<Pick<Complaint, "ticketId" | "status" | "title">>) =>
    bi(
      "Your recent complaints:\n" + list.map((c) => `• ${c.ticketId} — ${STATUS_LABEL[c.status as ComplaintStatus]} — ${trim(c.title, 40)}`).join("\n"),
      "आपकी हाल की शिकायतें:\n" + list.map((c) => `• ${c.ticketId} — ${STATUS_LABEL_HI[c.status as ComplaintStatus]}`).join("\n"),
    ),
};
