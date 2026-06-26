"use client";

import { FaEnvelopeOpenText, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import {
  FaClipboard,
  FaClipboardCheck,
  FaX,
  FaXTwitter,
} from "react-icons/fa6";
import { useState, useEffect } from "react";

interface ShareModalProps {
  pageLink: string;
  onClose: () => void;
}

interface SharePlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ pageLink, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);
  const sharePlatforms: SharePlatform[] = [
    {
      id: "twitter",
      name: "Twitter",
      icon: <FaXTwitter className="h-6 w-6" />,
      color: "text-foreground",
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: <FaLinkedin className="h-7 w-7" />,
      color: "text-foreground",
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: <FaWhatsapp className="h-7 w-7" />,
      color: "text-foreground",
    },
    {
      id: "gmail",
      name: "Email",
      icon: <FaEnvelopeOpenText className="h-6 w-6" />,
      color: "text-foreground",
    },
    {
      id: "copy",
      name: "Copy link",
      icon: <FaClipboard className="h-6 w-6" />,
      color: "text-foreground",
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };
  const handleShareClick = (platform: string) => {
    if (platform === "copy") {
      handleCopyLink();
      return;
    }

    let shareUrl = "";
    const encodedLink = encodeURIComponent(pageLink);

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedLink}&text=Check%20this%20out!`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodedLink}&title=Check%20this%20out`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=Check%20this%20out:%20${encodedLink}`;
        break;
      case "gmail":
        shareUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=Check%20this%20out&body=I%20thought%20you%20might%20find%20this%20interesting:%20${encodedLink}`;
        break;
      default:
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }

    onClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };
  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      } `}
    >
      <div
        className={`mx-auto w-full max-w-sm rounded-t-lg bg-card shadow-2xl transition-all duration-300 ${
          isVisible ? "translate-y-0 scale-100" : "translate-y-8 scale-95"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="pl-4 text-lg font-medium text-card-foreground">
            Share
          </h2>
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
          >
            <FaX className="h-4 w-4" />
          </button>
        </div>

        {/* Share Options */}
        <div className="px-2 pb-8">
          <div className="grid grid-cols-3 gap-2">
            {sharePlatforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleShareClick(platform.id)}
                className={`flex flex-col items-center justify-center rounded-lg p-3 transition-colors hover:bg-muted ${platform.color} relative`}
              >
                <div className="flex-shrink-0">
                  {platform.id === "copy" && copied ? (
                    <FaClipboardCheck className="h-6 w-6" />
                  ) : (
                    platform.icon
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
