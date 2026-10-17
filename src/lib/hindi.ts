import type { Category, ComplaintStatus, Severity } from "@/lib/types";
import type { TeamId } from "@/lib/teams";

// Hindi names for the things WhatsApp messages mention, so every message can go out in English and Hindi.

export const STATUS_LABEL_HI: Record<ComplaintStatus, string> = {
  REPORTED: "रिपोर्ट प्राप्त हुई",
  TRIAGED: "दर्ज, समीक्षा बाकी",
  ASSIGNED: "टीम को सौंपी गई",
  IN_PROGRESS: "काम चल रहा है",
  RESOLVED_PENDING_VERIFICATION: "समाधान दर्ज, जाँच जारी",
  CLOSED: "बंद",
  REOPENED: "फिर से खोली गई",
  NEEDS_INFO: "और जानकारी चाहिए",
  DUPLICATE: "मिलती-जुलती रिपोर्ट से जोड़ी गई",
  REJECTED: "स्वीकार नहीं की गई",
};

export const TEAM_LABEL_HI: Record<TeamId, string> = {
  ROADS_PUBLIC_WORKS: "सड़क एवं लोक निर्माण (डेमो कतार)",
  SANITATION: "स्वच्छता (डेमो कतार)",
  DRAINAGE: "जल निकासी (डेमो कतार)",
  WATER_SUPPLY: "जल आपूर्ति (डेमो कतार)",
  ELECTRICITY_STREETLIGHTS: "बिजली एवं स्ट्रीट लाइट (डेमो कतार)",
  GENERAL_ADMIN: "सामान्य प्रशासन (डेमो कतार)",
};

export const CATEGORY_LABEL_HI: Record<Category, string> = {
  ROAD_DAMAGE: "सड़क की खराबी",
  GARBAGE: "कचरा",
  DRAINAGE: "जल निकासी",
  WATER_SUPPLY: "जल आपूर्ति",
  STREET_LIGHT: "स्ट्रीट लाइट",
  OTHER: "अन्य / समीक्षा के लिए",
};

export const SEVERITY_LABEL_HI: Record<Severity, string> = {
  LOW: "कम",
  MEDIUM: "मध्यम",
  HIGH: "अधिक",
  CRITICAL: "अत्यंत गंभीर",
};
