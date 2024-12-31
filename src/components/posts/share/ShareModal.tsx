"use client";

import {
  FaEnvelopeOpenText,
  FaInstagram,
  FaLinkedin,
  FaWhatsapp,
} from "react-icons/fa";
import { FaX, FaXTwitter } from "react-icons/fa6";
import { useState } from "react";
import ToastNotification from "./ToastNotification";

interface ShareModalProps {
  pageLink: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ pageLink, onClose }) => {
  const [isToastOpen, setIsToastOpen] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pageLink);
    setIsToastOpen(true);
  };

  const handleShareClick = (platform: string) => {
    let shareUrl = "";
    switch (platform) {
      case "instagram":
        shareUrl = `https://www.instagram.com/`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${pageLink}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${pageLink}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${pageLink}`;
        break;
      case "gmail":
        shareUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=Check%20this%20out&body=${encodeURIComponent(
          pageLink
        )}`;
        break;
      default:
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank");
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70 px-6">
      <div className="bg-background w-[300px] lg:w-[500px] text-card-foreground rounded-lg shadow-lg p-6 relative">
        <button
          className="absolute top-6 right-6 p-2 hover:bg-neutral-500/35 rounded-full text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <FaX size={16} />
        </button>
        <h2 className="text-xl text-foreground font-semibold mb-6">Share via</h2>

        <div className="grid grid-cols-3 lg:grid-cols-5 items-center justify-center gap-4 mb-6">
          {/* Instagram */}
            <div
            onClick={() => handleShareClick("instagram")}
            className="flex flex-col items-center cursor-pointer p-4 rounded-lg hover:bg-muted transition"
            >
            <FaInstagram size={40} className="text-pink-600" />
            <span className="text-sm mt-2">Instagram</span>
            </div>

          {/* Twitter */}
          <div
            onClick={() => handleShareClick("twitter")}
            className="flex flex-col items-center cursor-pointer p-4 rounded-lg hover:bg-muted transition"
          >
            <FaXTwitter className="w-8 h-8 text-foreground" />
            <span className="text-sm mt-2">Twitter</span>
          </div>

          {/* LinkedIn */}
          <div
            onClick={() => handleShareClick("linkedin")}
            className="flex flex-col items-center cursor-pointer p-4 rounded-lg hover:bg-muted transition"
          >
            <FaLinkedin className="w-8 h-8 text-blue-600" />
            <span className="text-sm mt-2">LinkedIn</span>
          </div>

          {/* WhatsApp */}
          <div
            onClick={() => handleShareClick("whatsapp")}
            className="flex flex-col items-center cursor-pointer p-4 rounded-lg hover:bg-muted transition"
          >
            <FaWhatsapp className="w-8 h-8 text-green-600" />
            <span className="text-sm mt-2">WhatsApp</span>
          </div>

          {/* Gmail */}
          <div
            onClick={() => handleShareClick("gmail")}
            className="flex flex-col items-center cursor-pointer p-4 rounded-lg hover:bg-muted transition"
          >
            <FaEnvelopeOpenText className="w-8 h-8 text-primary" />
            <span className="text-sm mt-2">Mail</span>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button onClick={handleCopyLink} className="w-full">
            <div className="bg-muted w-[260px] lg:w-[440px] text-muted-foreground hover:underline rounded-lg px-6 py-2 overflow-hidden whitespace-nowrap text-ellipsis">
              {pageLink}
            </div>
          </button>
        </div>
      </div>

      {isToastOpen && (
        <ToastNotification
          title="Link Copied"
          description="The link has been copied to your clipboard."
          onClose={() => setIsToastOpen(false)}
        />
      )}
    </div>
  );
};

export default ShareModal;
