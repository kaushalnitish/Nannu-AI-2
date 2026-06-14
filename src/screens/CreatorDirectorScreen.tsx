import React, { useState, useMemo } from "react";
import { 
  ChevronLeft, 
  Sparkles, 
  ArrowRight, 
  Camera, 
  Smile, 
  Zap, 
  Film, 
  Music as MusicIcon, 
  Volume2, 
  Scissors, 
  Target, 
  ChevronsUpDown, 
  Gauge, 
  Headphones, 
  Activity, 
  MessageSquare, 
  Clapperboard,
  Tv,
  Check,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import GlowCard from "../components/GlowCard";
import { GeneratedScriptPayload } from "../types";

interface CreatorDirectorScreenProps {
  payload: GeneratedScriptPayload;
  prompt: string;
  mood: string;
  contentType: string;
  language: string;
  onBack: () => void;
}

export default function CreatorDirectorScreen({
  payload,
  prompt,
  mood,
  contentType,
  language = "English",
  onBack
}: CreatorDirectorScreenProps) {
  const [expandedScenes, setExpandedScenes] = useState<Record<string, boolean>>({
    hook: true,
    body: true,
    cta: true
  });

  const [completedScenes, setCompletedScenes] = useState<Record<string, boolean>>({
    hook: false,
    body: false,
    cta: false
  });

  const toggleScene = (sceneKey: string) => {
    setExpandedScenes(prev => ({
      ...prev,
      [sceneKey]: !prev[sceneKey]
    }));
  };

  const toggleCompleted = (sceneKey: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents collapsing or expanding the card when clicking the checkbox
    setCompletedScenes(prev => ({
      ...prev,
      [sceneKey]: !prev[sceneKey]
    }));
  };

  const totalScenes = 3;
  const completedCount = useMemo(() => {
    return Object.values(completedScenes).filter(Boolean).length;
  }, [completedScenes]);

  const progressPercent = useMemo(() => {
    return Math.round((completedCount / totalScenes) * 100);
  }, [completedCount]);

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // --- PAGE 1: COVER PAGE ---
      // Primary decorative background block (Vibrant Charcoal Top)
      doc.setFillColor(18, 18, 18);
      doc.rect(0, 0, 210, 60, "F");

      // Glowing accent marker row
      doc.setFillColor(200, 255, 90); // #C8FF5A
      doc.rect(0, 58, 210, 2, "F");

      // Title layout
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(26);
      doc.setTextColor(200, 255, 90); // #C8FF5A
      doc.text("CREATOR DIRECTOR", 15, 23);
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("PRO-GRADE SHORT-FORM STORYBOARD & FILMING BLUEPRINT", 15, 33);

      doc.setFont("Courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170); // Zinc color
      doc.text("AI ENGINE VER: CORE-STORYBOARD-v1.8 // PRODUCTION STATUS: LIVE", 15, 48);

      let y = 78;

      // Campaign prompt representation box
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 32, "F");
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.35);
      doc.rect(15, y, 180, 32, "S");
      // Neon green left border
      doc.setFillColor(200, 255, 90);
      doc.rect(15, y, 1.5, 32, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(115, 115, 115);
      doc.text("PRODUCTION TOPIC CONCEPT PROMPT:", 20, y + 7);

      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      const wrappedPrompt = doc.splitTextToSize(`"${prompt || "Custom Aesthetic Video Campaign"}"`, 168);
      // Limit to 2 lines
      const outputPromptLines = wrappedPrompt.slice(0, 2);
      for (let i = 0; i < outputPromptLines.length; i++) {
        doc.text(outputPromptLines[i], 20, y + 14 + (i * 5));
      }

      y += 44;

      // Production parameters heading
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(24, 24, 27);
      doc.text("PRODUCTION ATTRIBUTION METADATA", 15, y);
      
      doc.setDrawColor(200, 255, 90);
      doc.setLineWidth(0.5);
      doc.line(15, y + 2.5, 90, y + 2.5);

      y += 11;

      // Metadata layout block
      const metaItems = [
        { label: "Content format style", val: contentType },
        { label: "Target emotional delivery", val: mood },
        { label: "Vocal script language", val: language },
        { label: "Soundscape style preset", val: `${musicProfile.vibe}` },
        { label: "Background track tempo", val: musicProfile.tempo },
        { label: "Soundtrack outline", val: musicProfile.track },
        { label: "Filming progress state", val: `${completedCount} of ${totalScenes} scenes marked filmed` },
        { label: "Dossier timestamp", val: new Date().toLocaleDateString() + " at " + new Date().toLocaleTimeString() }
      ];

      doc.setFontSize(9.5);
      metaItems.forEach((item) => {
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(115, 115, 115);
        doc.text(`${item.label.toUpperCase()}:`, 15, y);

        doc.setFont("Helvetica", "normal");
        doc.setTextColor(24, 24, 27);
        doc.text(String(item.val), 75, y);

        y += 7.5;
      });

      y += 9;

      // Instructions block
      doc.setFillColor(240, 253, 244); // organic mint green bg
      doc.rect(15, y, 180, 48, "F");
      doc.setDrawColor(187, 247, 208);
      doc.rect(15, y, 180, 48, "S");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(21, 128, 61); // forest green
      doc.text("💡 AI DIRECTOR EXECUTIVE METHODOLOGY:", 20, y + 8);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(22, 101, 52); // green text
      const procedures = [
        "• Scene Alignment: Set your visual lighting & setup style precisely before starting roll.",
        "• Delivery Energy Targets: Adjust speech pacing matching the recommended intensity metrics.",
        "• Synchronized SFX Cue: Coordinate audio dips/rises on highlighted edit points in post.",
        "• Caption Typography Layering: Style central kinetic texts utilizing modern high contrast layouts.",
        "• Zero-Tail Loop Endpoint: Hard-crop speech exactly on the final word block to build replays."
      ];

      procedures.forEach((proc, idx) => {
        doc.text(proc, 20, y + 15 + (idx * 5.5));
      });

      // Cover Page Footer indicator
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170);
      doc.text("AI Director Storyboard System — Dossier Page 1 of 5", 105, 287, { align: "center" });


      // --- SCENES ENGINES (PAGES 2-4) ---
      const sceneKeys = ["hook", "body", "cta"] as const;

      sceneKeys.forEach((sceneKey, idx) => {
        doc.addPage();

        const data = targetStoryboardData[sceneKey];
        const isCompleted = completedScenes[sceneKey];

        let titlePrefix = "SCENE 01: THE HOOK BREAKOUT (0-3s)";
        let accentRGB = [255, 79, 216]; // #FF4FD8

        if (sceneKey === "body") {
          titlePrefix = "SCENE 02: THE VALUE BODY (3-45s)";
          accentRGB = [168, 85, 247]; // #A855F7
        } else if (sceneKey === "cta") {
          titlePrefix = "SCENE 03: THE CALL TO ACTION (45-60s)";
          accentRGB = [200, 255, 90]; // #C8FF5A
        }

        // Top Scene Block header
        doc.setFillColor(18, 18, 18);
        doc.rect(0, 0, 210, 22, "F");

        // Thin timeline border under headers
        doc.setFillColor(accentRGB[0], accentRGB[1], accentRGB[2]);
        doc.rect(0, 20, 210, 2, "F");

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text(titlePrefix.toUpperCase(), 15, 13);

        // Filming Status state badge on top right
        if (isCompleted) {
          doc.setFillColor(220, 252, 231); // green
          doc.rect(150, 7, 45, 7, "F");
          doc.setDrawColor(187, 247, 208);
          doc.rect(150, 7, 45, 7, "S");
          doc.setTextColor(21, 128, 61);
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(8);
          doc.text("STATE: FILMED ✔", 172.5, 12, { align: "center" });
        } else {
          doc.setFillColor(244, 244, 245); // neutral-100
          doc.rect(150, 7, 45, 7, "F");
          doc.setDrawColor(228, 228, 231);
          doc.rect(150, 7, 45, 7, "S");
          doc.setTextColor(113, 113, 122);
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(8);
          doc.text("STATE: PENDING FILMING", 172.5, 12, { align: "center" });
        }


        let curY = 32;

        // Dialogue Label
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("🎙️ SPOKEN DIALOGUE", 15, curY);

        curY += 4.5;

        // Draw elegant speech dialogue bounding card
        doc.setFillColor(250, 250, 251);
        const wrappedDiag = doc.splitTextToSize(`"${data.text}"`, 170);
        const diagHeight = (wrappedDiag.length * 5) + 10;

        doc.rect(15, curY, 180, diagHeight, "F");
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.rect(15, curY, 180, diagHeight, "S");
        // Colorful left anchor accent
        doc.setFillColor(accentRGB[0], accentRGB[1], accentRGB[2]);
        doc.rect(15, curY, 1.5, diagHeight, "F");

        // Write dialogue lines
        doc.setFont("Helvetica", "oblique");
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42); // slate-900

        for (let i = 0; i < wrappedDiag.length; i++) {
          doc.text(wrappedDiag[i], 21, curY + 7 + (i * 5));
        }

        curY += diagHeight + 11;


        // Columns separation: layout matching storyboard grid UI
        const colW = 84;
        const col1 = 15;
        const col2 = 111;

        // Subsection Headers lines
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(24, 24, 27);
        doc.text("🎬 ON-CAMERA PERFORMANCE", col1, curY);
        doc.setDrawColor(228, 228, 231);
        doc.setLineWidth(0.25);
        doc.line(col1, curY + 2.5, col1 + colW, curY + 2.5);

        doc.text("🎛️ POST-PRODUCTION STRATEGY", col2, curY);
        doc.line(col2, curY + 2.5, col2 + colW, curY + 2.5);

        curY += 8;

        const originalColY = curY;
        let ly = originalColY;

        // LEFT COLUMN: PERFORMANCE
        // 1. Frame Shot Type
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(115, 115, 115);
        doc.text("📷 FRAME & SHOT TYPE", col1, ly);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(24, 24, 27);
        ly += 4.5;
        doc.text(data.frameType, col1, ly);

        ly += 9;

        // 2. Expressions
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(115, 115, 115);
        doc.text("😐 PERFORMANCE EXPRESSION", col1, ly);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(63, 63, 70);
        const wrappedFace = doc.splitTextToSize(data.facialExpression, colW);
        for (let i = 0; i < wrappedFace.length; i++) {
          doc.text(wrappedFace[i], col1, ly + 4.5 + (i * 4));
        }
        ly += 4.5 + (wrappedFace.length * 4) + 5;

        // 3. Gestures
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(115, 115, 115);
        doc.text("✋ RECOMMEND GESTURE", col1, ly);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(63, 63, 70);
        const wrappedGest = doc.splitTextToSize(data.handGestures, colW);
        for (let i = 0; i < wrappedGest.length; i++) {
          doc.text(wrappedGest[i], col1, ly + 4.5 + (i * 4));
        }
        ly += 4.5 + (wrappedGest.length * 4) + 5;

        // 4. Energy
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(115, 115, 115);
        doc.text("⚡ PERFORMANCE ENERGY TARGET", col1, ly);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(217, 119, 6); // amber color
        ly += 4.5;
        doc.text(data.energyLevel, col1, ly);


        // RIGHT COLUMN: POST STRATEGY
        let ry = originalColY;

        // 1. B-Roll Footage
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(115, 115, 115);
        doc.text("🎥 B-ROLL OVERLAY SUGGESTIONS", col2, ry);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(40, 40, 45);
        const wrappedBroll = doc.splitTextToSize(data.bRoll, colW);
        const brollBoxH = (wrappedBroll.length * 4) + 6;

        doc.setFillColor(248, 250, 252);
        doc.rect(col2, ry + 2, colW, brollBoxH, "F");
        doc.setDrawColor(226, 232, 240);
        doc.rect(col2, ry + 2, colW, brollBoxH, "S");

        for (let i = 0; i < wrappedBroll.length; i++) {
          doc.text(wrappedBroll[i], col2 + 3, ry + 6 + (i * 4));
        }
        ry += brollBoxH + 9;

        // 2. Background Soundscapes & Audios
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(115, 115, 115);
        doc.text("🎵 TRACK SOUNDSCAPE & SFX CUES", col2, ry);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(63, 63, 70);
        ry += 4.5;
        doc.text(`Soundtrack: ${data.musicMood}`, col2, ry);
        ry += 4.5;
        doc.text(`SFX Timing: ${data.sfx}`, col2, ry);

        ry += 9;

        // 3. Editing Cuts and Overlays guidelines
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(115, 115, 115);
        doc.text("✂️ POST-PRODUCTION EDIT REC", col2, ry);

        doc.setFont("Courier", "bold");
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        const wrappedEdit = doc.splitTextToSize(data.edit, colW);
        const editBoxH = (wrappedEdit.length * 3.5) + 6;

        doc.setFillColor(250, 250, 251);
        doc.rect(col2, ry + 2, colW, editBoxH, "F");
        doc.setDrawColor(228, 228, 231);
        doc.rect(col2, ry + 2, colW, editBoxH, "S");

        for (let i = 0; i < wrappedEdit.length; i++) {
          doc.text(wrappedEdit[i], col2 + 3, ry + 6 + (i * 3.5));
        }


        // BOTTOM SECTION: RETENTION KEYWORD BANNER
        const currentLowerLimit = Math.max(ly, ry + editBoxH + 4);
        const rentBoxY = Math.min(242, Math.max(212, currentLowerLimit + 8));

        doc.setFillColor(240, 253, 244); // light green organic
        doc.rect(15, rentBoxY, 180, 23, "F");
        doc.setDrawColor(187, 247, 208);
        doc.rect(15, rentBoxY, 180, 23, "S");

        // Accent tag bar
        doc.setFillColor(21, 128, 61);
        doc.rect(15, rentBoxY, 1.5, 23, "F");

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(21, 128, 61);
        doc.text("🎯 TARGET RETENTION TRIGGER", 20, rentBoxY + 65.5 - 60);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(22, 101, 52);
        const wrappedReten = doc.splitTextToSize(data.retentionTrigger, 170);
        for (let i = 0; i < wrappedReten.length; i++) {
          doc.text(wrappedReten[i], 20, rentBoxY + 11.5 + (i * 4.5));
        }

        // Scene Page Footer indicator
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(161, 161, 170);
        doc.text(`AI Director Storyboard System — Dossier Page ${idx + 2} of 5`, 105, 287, { align: "center" });
      });

      // --- PAGE 5: SUMMARY & PRINT-READY CHECKLIST ---
      doc.addPage();

      // Block header
      doc.setFillColor(18, 18, 18);
      doc.rect(0, 0, 210, 22, "F");

      // Accent timeline line
      doc.setFillColor(200, 255, 90);
      doc.rect(0, 20, 210, 2, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text("SUMMARY & PRINT-READY CHECKLIST", 15, 13);

      let sy = 34;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(24, 24, 27);
      doc.text("MASTER FILMING WORKFLOW", 15, sy);
      doc.setDrawColor(228, 228, 231);
      doc.setLineWidth(0.5);
      doc.line(15, sy + 2.5, 195, sy + 2.5);

      sy += 11;

      // Master Info Summary Panel (progress etc.)
      doc.setFillColor(250, 250, 251);
      doc.rect(15, sy, 180, 24, "F");
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.rect(15, sy, 180, 24, "S");
      // left border
      doc.setFillColor(200, 255, 90);
      doc.rect(15, sy, 1.5, 24, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(115, 115, 115);
      doc.text("FILMING LOG STATUS:", 20, sy + 6.5);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(24, 24, 27);
      doc.text(`${completedCount} of ${totalScenes} scenes marked as filmed (${progressPercent}% progress completed via the digital dashboard).`, 60, sy + 6.5);

      doc.setFont("Helvetica", "bold");
      doc.setTextColor(115, 115, 115);
      doc.text("PRINT-READY USE:", 20, sy + 12.5);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(24, 24, 27);
      doc.text("Print this companion guide and track filming live in the studio with checkboxes.", 60, sy + 12.5);

      doc.setFont("Helvetica", "bold");
      doc.setTextColor(115, 115, 115);
      doc.text("SOUND PRESET:", 20, sy + 18.5);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(24, 24, 27);
      doc.text(`${musicProfile.vibe} (${musicProfile.tempo}) - Track: ${musicProfile.track}`, 60, sy + 18.5);

      sy += 34;

      // Section for each scene
      const summaryScenes = ["hook", "body", "cta"] as const;
      summaryScenes.forEach((sKey, sIdx) => {
        const sData = targetStoryboardData[sKey];
        const sCompleted = completedScenes[sKey];

        let sTitle = "SCENE 01: THE HOOK (0-3s)";
        if (sKey === "body") {
          sTitle = "SCENE 02: THE VALUE BODY (3-45s)";
        } else if (sKey === "cta") {
          sTitle = "SCENE 03: THE CALL TO ACTION (45-60s)";
        }

        // Draw physical Checkbox Box at (15, sy)
        const boxX = 15;
        const boxY = sy;
        const boxSize = 7;

        doc.setLineWidth(0.4);
        if (sCompleted) {
          // Green fill box
          doc.setFillColor(52, 211, 153); // emerald 400
          doc.rect(boxX, boxY, boxSize, boxSize, "F");
          doc.setDrawColor(16, 185, 129); // emerald 500
          doc.rect(boxX, boxY, boxSize, boxSize, "S");
          // Draw checkmark lines
          doc.setLineWidth(0.6);
          doc.setDrawColor(0, 0, 0); // black checkmark for high contrast
          doc.line(boxX + 1.5, boxY + 3.5, boxX + 3, boxY + 5.2);
          doc.line(boxX + 3, boxY + 5.2, boxX + 5.5, boxY + 1.8);
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(boxX, boxY, boxSize, boxSize, "F");
          doc.setDrawColor(161, 161, 170); // zinc-400
          doc.rect(boxX, boxY, boxSize, boxSize, "S");
        }

        // Scene Title
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(24, 24, 27);
        doc.text(sTitle, boxX + 11, boxY + 5);

        // Scene metadata tag in small fonts (Shot type, tempo/sound SFX)
        doc.setFillColor(244, 244, 245);
        doc.rect(boxX + 11, boxY + 7.5, 169, 6, "F");
        doc.setDrawColor(228, 228, 231);
        doc.setLineWidth(0.2);
        doc.rect(boxX + 11, boxY + 7.5, 169, 6, "S");

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(113, 113, 122);
        doc.text("SHOT TYPE: ", boxX + 13, boxY + 11.8);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(39, 39, 42);
        doc.text(`${sData.frameType}`, boxX + 31, boxY + 11.8);

        doc.setFont("Helvetica", "bold");
        doc.setTextColor(113, 113, 122);
        doc.text("|  SFX CUES: ", boxX + 52, boxY + 11.8);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(39, 39, 42);
        doc.text(`${sData.sfx}`, boxX + 72, boxY + 11.8);

        doc.setFont("Helvetica", "bold");
        doc.setTextColor(113, 113, 122);
        doc.text("|  ENERGY: ", boxX + 130, boxY + 11.8);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(217, 119, 6);
        doc.text(`${sData.energyLevel}`, boxX + 147, boxY + 11.8);

        // Dialogue text snippet
        doc.setFont("Helvetica", "oblique");
        doc.setFontSize(9);
        doc.setTextColor(63, 63, 70);
        const wrappedSnippet = doc.splitTextToSize(`"${sData.text}"`, 169);
        const maxLinesToPrint = Math.min(2, wrappedSnippet.length);
        for (let i = 0; i < maxLinesToPrint; i++) {
          doc.text(wrappedSnippet[i], boxX + 11, boxY + 18.5 + (i * 4));
        }

        sy += 36;
      });

      // Simple Signature Sign-off footer
      doc.setDrawColor(200, 220, 200);
      doc.setLineWidth(0.3);
      doc.line(15, sy + 7, 75, sy + 7);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(115, 115, 115);
      doc.text("CREATOR / DIRECTOR SIGN-OFF", 15, sy + 11.5);

      doc.line(135, sy + 7, 195, sy + 7);
      doc.text("DATE OF SUCCESSFUL COMPLETION", 135, sy + 11.5);

      // Summary Page Footer indicator
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170);
      doc.text("AI Director Storyboard System — Dossier Page 5 of 5", 105, 287, { align: "center" });

      // Saving and downloading trigger named beautifully
      const cleanPromptName = prompt
        ? prompt.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 35)
        : "production_guide";
      const filename = `director_storyboard_${cleanPromptName}.pdf`;
      doc.save(filename);
      
    } catch (err) {
      console.error("Failed to compile Storyboard PDF:", err);
    }
  };

  // Extract keywords dynamically to customize suggestions for the exact topic
  const dynamicKeywords = useMemo(() => {
    if (!prompt) return { main: "creator topic", secondary: "value insight", theme: "general" };
    
    const words = prompt
      .toLowerCase()
      .split(/\s+/)
      .map(w => w.replace(/[^a-z0-9]/g, ""))
      .filter(w => w.length > 4 && !["about", "these", "those", "their", "where", "there", "would", "could", "should", "using", "built"].includes(w));
    
    const main = words[0] || "niche craft";
    const secondary = words[1] || words[0] || "core concept";
    
    // Determine context theme
    let theme = "general";
    const textToScan = (prompt + " " + (payload?.script?.hook?.text || "")).toLowerCase();
    
    if (["code", "developer", "software", "dev", "tech", "coding", "javascript", "programmer", "react"].some(k => textToScan.includes(k))) {
      theme = "tech";
    } else if (["money", "rich", "millionaire", "luxury", "sales", "business", "clients", "revenue", "saas"].some(k => textToScan.includes(k))) {
      theme = "business";
    } else if (["toxic", "9-to-5", "job", "office", "employee", "corporate", "career"].some(k => textToScan.includes(k))) {
      theme = "corporate";
    } else if (["health", "fitness", "meditation", "gym", "workout", "mindfulness", "diet"].some(k => textToScan.includes(k))) {
      theme = "wellness";
    }
    
    return { main, secondary, theme };
  }, [prompt, payload]);

  // Overall Music recommendation details based on vibe/mood and content type
  const musicProfile = useMemo(() => {
    const cleanMood = mood.toLowerCase();
    
    if (cleanMood.includes("deep") || cleanMood.includes("🧘") || cleanMood.includes("philosophical")) {
      return {
        vibe: "🧘 Philosophical Ambient",
        track: "Ambient Piano & Soft Cosmic Atmosphere",
        intensity: "Low (Subtle)",
        tempo: "75 BPM"
      };
    } else if (cleanMood.includes("luxury") || cleanMood.includes("💎") || cleanMood.includes("prestige")) {
      return {
        vibe: "💎 Premium Aspirational Lounge",
        track: "Elegant Chillhop & Fashion film beats",
        intensity: "Medium-Low",
        tempo: "105 BPM"
      };
    } else if (cleanMood.includes("roast") || cleanMood.includes("🌶️") || cleanMood.includes("brutal")) {
      return {
        vibe: "🌶️ Witty Punchy Satire Beats",
        track: "Playful Trap & Comic percussion accents",
        intensity: "Medium (Snappy and building tension)",
        tempo: "92 BPM"
      };
    } else if (cleanMood.includes("educational") || cleanMood.includes("🧠") || cleanMood.includes("tutorial")) {
      return {
        vibe: "🎓 High-Engagement Focus Lofi",
        track: "Focus-Optimized Modern Plucks (No Voice)",
        intensity: "Low-Medium (Zero lyric distraction)",
        tempo: "90 BPM"
      };
    } else if (cleanMood.includes("controversial") || cleanMood.includes("🔥") || cleanMood.includes("hot")) {
      return {
        vibe: "🔥 Documentary Investigative Tension",
        track: "Tense Rhythmic Drops & Heavy subfrequency-pulses",
        intensity: "Medium (Building dramatic peaks)",
        tempo: "84 BPM"
      };
    } else if (cleanMood.includes("funny") || cleanMood.includes("😂")) {
      return {
        vibe: "😂 Lighthearted Whimsical",
        track: "Bouncy Quirky Keys & Upbeat Lofi percussion",
        intensity: "Medium-Low",
        tempo: "95 BPM"
      };
    } else if (cleanMood.includes("emotional") || cleanMood.includes("❤️") || cleanMood.includes("vulnerable")) {
      return {
        vibe: "❤️ Emotional Heartfelt Strings",
        track: "Cinematic Acoustics & Soft Warm Cello swells",
        intensity: "Low-Medium (Spikes on key words)",
        tempo: "70 BPM"
      };
    } else if (cleanMood.includes("energy") || cleanMood.includes("🚀") || cleanMood.includes("fast")) {
      return {
        vibe: "🚀 High-Velocity Hype Motion",
        track: "Dynamic Heavy Synthwave or Accelerated Phonk",
        intensity: "High (Max motivation, boosted sub-bass)",
        tempo: "128 BPM"
      };
    } else {
      return {
        vibe: "😎 Confident Creator Groove",
        track: "Sleek Lounge Keys & Steady Low Basslines",
        intensity: "Medium-Low (Steady undercurrent)",
        tempo: "88 BPM"
      };
    }
  }, [mood]);

  // Dynamic Scene Blueprint Advice Generator based on script text & context
  const targetStoryboardData = useMemo(() => {
    const s = payload.script;
    const kw = dynamicKeywords;
    const moodStr = mood;

    const thematicBackground = kw.theme === "tech" 
      ? `A clean, dark studio room with subtle blue/neon backglows, tech monitors faintly legible, or simple minimalist workstation lines.`
      : kw.theme === "business"
      ? `Crisp modern workspace, bright minimalist interior, clean lines, or solid professional dark background.`
      : kw.theme === "corporate"
      ? `A sleek home-office corner with balanced accent lighting contrasting mundane designs.`
      : kw.theme === "wellness"
      ? `Warm side-lit organic studio environment with green container plants and natural wooden textures.`
      : `Minimalist high-contrast studio backdrop with focused key-light highlighting the creator.`;

    const thematicFocusBroll = kw.theme === "tech"
      ? `Zoom-cut into code terminal highlight or sleek developer dashboard screenshot.`
      : kw.theme === "business"
      ? `Visual chart showing an upward-trending vector indicator or a slick SaaS app mockup.`
      : `Close shot of sketchpad drawing diagrams mapping out the key system.`;

    return {
      hook: {
        text: s.hook.text || "No text loaded.",
        frameType: "Close Up" as const,
        facialExpression: moodStr.includes("Controversial") || moodStr.includes("🌶️") 
          ? "Deep, focused eye lock with the lens. Command visual dominance instantly with a firm, intense posture."
          : moodStr.includes("Funny") || moodStr.includes("😂")
          ? "An empathetic micro-smirk of shared recognition, breaking into vibrant, friendly engagement."
          : "Highly deliberate, clear focus. A firm conversational nod to lock user's scrolling speed.",
        handGestures: "Keep hands centered. Double palm push-forward exactly at the hook word to visually anchor attention.",
        energyLevel: moodStr.includes("High Energy") || moodStr.includes("🚀") ? "95% (Punchy & Immediate)" : "85% (Firm, authoritative visual pace)",
        bRoll: `Under the hook statement, flash a 0.8s micro-clip of typing '${kw.main}' on terminal or an extreme close-up of hands drawing layout highlights.`,
        musicMood: `${musicProfile.vibe} — Rising build-up at intro`,
        sfx: "Subtle sub-bass drop / low-frequency boom paired with a digital whoosh transition.",
        edit: `• Zoom: Rapid 10% punch-in on the core hook keyword.\n• Cut: Ultra-aggressive edit cutting out all dead air at 0.0s.\n• Captions: Center-screen bold kinetic styling, highlighted in yellow/neon.\n• Overlays: Slide in large faint text '${kw.main.toUpperCase()}' at the bottom.\n• Emphasis: Let the first word land, then trigger a 0.4s micro-pause of pure tension.`,
        retentionTrigger: "Shatter user's casual swiping behavior within the first 800 milliseconds by dropping a pattern-rupturing sound drop and physical eye-level grid freeze."
      },
      body: {
        text: s.body.text || "No text loaded.",
        frameType: "Medium Shot" as const,
        facialExpression: "Approachable, expert-mentor persona. Wide, curious eyes of discovery, nodding to punctuate key insights.",
        handGestures: "Symmetry pacing gesture. Alternating raised palms spatially partitioning Option A versus Option B.",
        energyLevel: "82% (Steady, authoritative educational rhythm)",
        bRoll: `Overlay interactive graphics of ${thematicFocusBroll}. Showcase key data items or slides showing the ${kw.secondary} roadmap.`,
        musicMood: `${musicProfile.vibe} — Main steady looping rhythm`,
        sfx: "Light mechanical keyboard typing noises or smooth paper-turn texture sounds supporting screen item reveals.",
        edit: `• Zoom: Smooth, slow alternate camera punches (5% step scale) every 4 seconds.\n• Cut: Edit precisely on natural syllable boundaries to enforce speed.\n• Captions: Bottom-third clean layout in secondary branded colors with key figures enlarged.\n• Overlays: Highlight steps 1, 2, 3 floating dynamically beside you.\n• Emphasis: Sudden audio mute for 0.5s right before stating: 'But here is the real catch.'`,
        retentionTrigger: "Incorporate alternating B-roll cards and animated pointer flags every 3.5 seconds to bypass retina exhaustion and retain deep focus."
      },
      cta: {
        text: s.cta.text || "No text loaded.",
        frameType: "POV Shot" as const,
        facialExpression: "Warm, collaborative, authentic, and reassuring. Soft grin communicating trust and absolute invite.",
        handGestures: "Single open palm extending softly toward the camera lens to invite immediate visitor partnership.",
        energyLevel: moodStr.includes("High Energy") || moodStr.includes("🚀") ? "90% (Hype & Motivating climax)" : "85% (Confident, low-friction finish)",
        bRoll: "Slide up clean minimal custom branding asset card, or a smart overlay pointing directly to lower screen sections.",
        musicMood: `${musicProfile.vibe} — Peaks at climax then absolute tape-stop silence`,
        sfx: "Gentle warm chime ring or elegant notification bell effect on the exact action word.",
        edit: `• Zoom: Steady continuous camera push-in ending in a snug direct framing profile.\n• Cut: Hard crop on the absolute last word syllable. No tail, no trailing quiet frames.\n• Captions: Single clean high-focus brand colored text centering the final call to action.\n• Overlays: A micro QR element or sleek modern arrow design sliding up cleanly.\n• Emphasis: Deliver the absolute final action item over total track silence.`,
        retentionTrigger: "Cut the video abruptly right on the peak pitch of the last spoken syllable to trigger seamless replay loop indexes on feeds."
      }
    };
  }, [payload, dynamicKeywords, mood, musicProfile]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col flex-1 pb-6 font-sans text-left"
    >
      {/* Header Back Controls */}
      <div className="flex items-center justify-between mb-5 text-xs font-mono text-[#A1A1AA]">
        <button 
          onClick={onBack} 
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer font-bold select-none font-sans"
        >
          <ChevronLeft size={16} />
          <span>BACK TO SCRIPT</span>
        </button>
        <span className="text-[#C8FF5A] font-bold uppercase tracking-widest bg-[#C8FF5A]/10 px-2.5 py-1 rounded-full border border-[#C8FF5A]/20 select-none flex items-center gap-1">
          <Clapperboard size={12} className="animate-pulse" />
          <span>DIRECTOR STORYBOARD ACTIVE</span>
        </span>
      </div>

      {/* Main Title Intro with Export to PDF Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5 border-b border-white/5 pb-5 select-none">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight text-white mb-0.5">
            🎬 AI Director Storyboard
          </h2>
          <p className="text-xs text-[#A1A1AA]">
            A unified production blueprint. Every scene optimized with delivery coaching, visual angles, editing instructions, and retention cues.
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          title="Download professional PDF production guide document"
          className="flex items-center justify-center gap-2 px-4.5 py-2.5 bg-[#C8FF5A] hover:bg-[#b5e651] text-black font-extrabold text-xs font-mono rounded-xl shrink-0 transition-all duration-200 shadow-[0_4px_12px_rgba(200,255,90,0.12)] hover:shadow-[0_4px_20px_rgba(200,255,90,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
        >
          <Download size={14} className="stroke-[3]" />
          <span>EXPORT PDF PRODUCTION GUIDE</span>
        </button>
      </div>

      {/* Topic Context Indicator Banner */}
      <div className="mb-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-3.5 items-center select-none">
        <div className="p-2.5 rounded-lg bg-[#C8FF5A]/10 text-[#C8FF5A] shrink-0 border border-[#C8FF5A]/20">
          <Sparkles size={16} className="text-[#C8FF5A]" />
        </div>
        <div className="overflow-hidden">
          <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 block">SPATIAL CONCEPT SPECIALIZATION</span>
          <span className="text-xs text-white font-semibold truncate block mt-0.5">
            "{prompt || "Custom Aesthetic Video Campaign"}"
          </span>
        </div>
      </div>

      {/* Style & Target Delivery Info Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <GlowCard glowColor="none" className="p-3 bg-[#111111]/80 border border-white/5 rounded-xl flex items-center gap-3">
          <Gauge size={15} className="text-[#FF4FD8] shrink-0" />
          <div>
            <span className="text-[8px] font-mono uppercase text-white/40 tracking-wider">Style & Target Vibe</span>
            <span className="text-[11px] font-bold text-white block mt-0.5">
              {contentType} • {mood}
            </span>
          </div>
        </GlowCard>
        
        <GlowCard glowColor="none" className="p-3 bg-[#111111]/80 border border-white/5 rounded-xl flex items-center gap-3">
          <Headphones size={15} className="text-[#C8FF5A] shrink-0" />
          <div>
            <span className="text-[8px] font-mono uppercase text-[#A1A1AA] tracking-wider">Sound Preset</span>
            <span className="text-[11px] font-semibold text-[#C8FF5A] block mt-0.5 truncate">
              {musicProfile.vibe} ({musicProfile.tempo})
            </span>
          </div>
        </GlowCard>
      </div>

      {/* Filming Progress Tracker Bar */}
      <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="flex justify-between items-center mb-2 select-none">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#A1A1AA] font-black">FILMING PROGRESS TRACKER</span>
            {completedCount === totalScenes && (
              <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                🎉 ALL SCENES FILMED!
              </span>
            )}
          </div>
          <span className="text-xs font-mono text-white font-bold animate-pulse">
            {completedCount}/{totalScenes} Scenes Completed ({progressPercent}% Done)
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#C8FF5A] to-emerald-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
          />
        </div>
      </div>

      {/* Unified Storyboard Cards */}
      <div className="space-y-4">
        {(["hook", "body", "cta"] as const).map((sceneKey, index) => {
          const isExpanded = expandedScenes[sceneKey];
          const isCompleted = completedScenes[sceneKey];
          const data = targetStoryboardData[sceneKey];
          
          let titlePrefix = "SCENE 01: THE HOOK (0-3s)";
          let badgeColor = "bg-[#FF4FD8]/10 text-[#FF4FD8] border-[#FF4FD8]/20";
          
          if (sceneKey === "body") {
            titlePrefix = "SCENE 02: THE VALUE BODY (3-45s)";
            badgeColor = "bg-[#A855F7]/10 text-[#A855F7] border-[#A855F7]/20";
          } else if (sceneKey === "cta") {
            titlePrefix = "SCENE 03: THE CTA (45-60s)";
            badgeColor = "bg-[#C8FF5A]/10 text-[#C8FF5A] border-[#C8FF5A]/20";
          }

          return (
            <div key={sceneKey} className="relative pl-4 border-l border-white/5">
              {/* Timeline Indicator Badge Node */}
              <div 
                className={`absolute -left-[5px] top-6 w-2.5 h-2.5 rounded-full border z-10 transition-all duration-300 ${
                  isCompleted 
                    ? "bg-emerald-450 border-emerald-450 shadow-[0_0_8px_rgba(52,211,153,0.5)]" 
                    : "bg-[#111111]"
                }`}
                style={{ borderColor: isCompleted ? undefined : sceneKey === "hook" ? "#FF4FD8" : sceneKey === "body" ? "#A855F7" : "#C8FF5A" }}
              />

              <div className="relative group">
                <button
                  type="button"
                  onClick={() => toggleScene(sceneKey)}
                  className="w-full text-left cursor-pointer select-none"
                >
                  <GlowCard 
                    glowColor="none" 
                    className={`p-4 bg-[#121212]/90 border transition-all duration-300 relative rounded-2xl ${
                      isCompleted ? "border-emerald-500/20 bg-emerald-950/[0.02]" : isExpanded ? "border-white/10" : "border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {/* Completion Checkbox - stops propagation to prevent toggling card expansion */}
                        <div 
                          onClick={(e) => toggleCompleted(sceneKey, e)}
                          title={isCompleted ? "Mark as filming in progress" : "Mark as filmed"}
                          className={`w-5.5 h-5.5 rounded-md border flex items-center justify-center cursor-pointer shrink-0 transition-all duration-300 ${
                            isCompleted 
                              ? "bg-emerald-500 border-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.4)]" 
                              : "border-white/20 bg-black/40 hover:border-white/40 text-transparent"
                          }`}
                        >
                          <Check size={12} className="stroke-[3]" />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 overflow-hidden">
                          <span className={`text-[8.5px] font-mono uppercase tracking-widest font-black border px-2 py-0.5 rounded-md shrink-0 transition-colors ${
                            isCompleted ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : badgeColor
                          }`}>
                            {titlePrefix}
                          </span>
                          <p className={`text-xs font-sans truncate pr-4 max-w-[200px] sm:max-w-[280px] md:max-w-[400px] transition-all duration-300 ${
                            isCompleted ? "text-[#A1A1AA]/40 line-through italic" : "text-[#A1A1AA]"
                          }`}>
                            "{data.text}"
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-white/40 group-hover:text-white transition-colors flex items-center gap-2">
                        {isCompleted && (
                          <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-400/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 select-none">
                            FILMED
                          </span>
                        )}
                        <ChevronsUpDown size={14} />
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          {/* 🎙️ Dialogue Segment */}
                          <div className="mt-4 bg-black/60 p-4 rounded-xl border border-white/5 select-text">
                            <span className="text-[8px] font-mono text-[#C8FF5A] uppercase tracking-widest block mb-2 font-black">
                              🎙️ SPEECH DIALOGUE
                            </span>
                            <blockquote className="text-sm text-white font-medium leading-relaxed italic border-l-2 border-[#C8FF5A] pl-3 py-0.5">
                              {data.text}
                            </blockquote>
                          </div>

                          {/* Simplified Content Grid detailing all required specs in one spot */}
                          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Left Column: On-Camera Performance Direction */}
                            <div className="space-y-4 bg-white/[0.01] p-4 rounded-xl border border-white/[0.03]">
                              <h4 className="text-[10px] font-mono font-black text-white/40 tracking-widest border-b border-white/5 pb-2 uppercase">
                                🎬 On-Camera Performance
                              </h4>

                              {/* Shot Type & Frame */}
                              <div>
                                <span className="text-[9px] font-mono text-[#A1A1AA] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                                  <Camera size={12} className="text-[#C8FF5A]" />
                                  <span>📷 Frame & Shot Type</span>
                                </span>
                                <p className="text-xs text-white font-bold mt-1.5 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF5A]" />
                                  {data.frameType}
                                </p>
                              </div>

                              {/* Face expression */}
                              <div>
                                <span className="text-[9px] font-mono text-[#A1A1AA] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                                  <Smile size={12} className="text-[#FF4FD8]" />
                                  <span>😐 Expression & Inflection</span>
                                </span>
                                <p className="text-xs text-white/95 leading-relaxed mt-1">{data.facialExpression}</p>
                              </div>

                              {/* Hand movement / gesture */}
                              <div>
                                <span className="text-[9px] font-mono text-[#A1A1AA] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                                  <Activity size={12} className="text-[#A855F7]" />
                                  <span>✋ Gesture & Body Language</span>
                                </span>
                                <p className="text-xs text-white/95 leading-relaxed mt-1">{data.handGestures}</p>
                              </div>

                              {/* Energy Level percentage */}
                              <div>
                                <span className="text-[9px] font-mono text-[#A1A1AA] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                                  <Zap size={12} className="text-[#F59E0B]" />
                                  <span>⚡ Energy Level</span>
                                </span>
                                <p className="text-xs text-[#F59E0B] font-extrabold mt-1 uppercase tracking-wide">
                                  {data.energyLevel}
                                </p>
                              </div>
                            </div>

                            {/* Right Column: Audio, B-Roll, Edit and Retention */}
                            <div className="space-y-4 bg-white/[0.01] p-4 rounded-xl border border-white/[0.03]">
                              <h4 className="text-[10px] font-mono font-black text-white/40 tracking-widest border-b border-white/5 pb-2 uppercase">
                                🎛️ Post-Production Strategy
                              </h4>

                              {/* B-Roll Footage overlays */}
                              <div>
                                <span className="text-[9px] font-mono text-[#A1A1AA] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                                  <Film size={12} className="text-[#3B82F6]" />
                                  <span>🎥 B-Roll Suggestions</span>
                                </span>
                                <p className="text-xs text-white font-medium bg-[#3B82F6]/5 border border-[#3B82F6]/10 p-2.5 rounded-lg mt-1 italic text-left leading-relaxed">
                                  {data.bRoll}
                                </p>
                              </div>

                              {/* Acoustic profile */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <span className="text-[9px] font-mono text-[#A1A1AA] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                                    <MusicIcon size={12} className="text-[#10B981]" />
                                    <span>🎵 Background Music</span>
                                  </span>
                                  <p className="text-[11px] text-white/90 mt-1">{data.musicMood}</p>
                                </div>
                                <div>
                                  <span className="text-[9px] font-mono text-[#A1A1AA] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                                    <Volume2 size={12} className="text-[#06B6D4]" />
                                    <span>🔊 SFX Cue Points</span>
                                  </span>
                                  <p className="text-[11px] text-white/90 mt-1 font-mono">{data.sfx}</p>
                                </div>
                              </div>

                              {/* Edit details */}
                              <div>
                                <span className="text-[9px] font-mono text-[#A1A1AA] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                                  <Scissors size={12} className="text-[#EC4899]" />
                                  <span>✂️ Edit Guidelines</span>
                                </span>
                                <div className="text-[11px] text-white/90 mt-1.5 space-y-1.5 bg-white/[0.02] p-2.5 rounded-lg border border-white/5 whitespace-pre-line tracking-wide">
                                  {data.edit}
                                </div>
                              </div>

                              {/* Retention Trigger highlight */}
                              <div className="pt-2 border-t border-white/5">
                                <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-black flex items-center gap-1.5 animate-pulse">
                                  <Target size={12} />
                                  <span>🎯 Retention Trigger</span>
                                </span>
                                <p className="text-xs text-emerald-300 font-medium leading-relaxed mt-1">
                                  {data.retentionTrigger}
                                </p>
                              </div>

                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlowCard>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Done Controls Button */}
      <div className="pt-6">
        <button
          onClick={onBack}
          className="w-full py-4 px-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold text-xs uppercase font-sans flex items-center justify-center gap-2 transition-all cursor-pointer font-mono"
        >
          <span>Done Viewing AI Production Plan</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}
