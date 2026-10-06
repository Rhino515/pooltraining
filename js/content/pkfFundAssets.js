/**
 * PKF Fundamentals — source image map.
 * Original PKF JPEGs (PDF pages 9–34) copied byte-for-byte into images/pkf-fund/.
 * Crops are CSS viewports only (height-based positioning, same math as PKF Banking / Cue Ball Control).
 * Nothing is redrawn; labels, people, hands, cues and bridges stay exactly as printed.
 *
 * Printed page = PDF − 9 for Chapter One (PDF 11–22 → pages 2–13) and PDF − 11 for Chapter Two
 * (PDF 25–33 → pages 14–22). PDF 9 = FUNDAMENTALS divider, PDF 23 = BRIDGES/STANCES divider,
 * PDF 10 / 24 / 34 = blank.
 */
export const PKF_FUND_IMG_DIR = './images/pkf-fund';

/** PDF page → original file. view = whole page (used by VIEW FULL PKF PAGE). */
export const PAGES = {
  9: { src: './images/pkf-fund/PKF_Fundamentals_PDF_009.jpg', pdf: 9, printed: null, kind: 'divider', w: 970, h: 1258, view: { x: 0, y: 0, w: 1, h: 1 } },
  10: { src: './images/pkf-fund/PKF_Fundamentals_PDF_010.jpg', pdf: 10, printed: null, kind: 'blank', w: 970, h: 1258, view: { x: 0, y: 0, w: 1, h: 1 } },
  11: { src: './images/pkf-fund/PKF_Fundamentals_PDF_011.jpg', pdf: 11, printed: 2, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  12: { src: './images/pkf-fund/PKF_Fundamentals_PDF_012.jpg', pdf: 12, printed: 3, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  13: { src: './images/pkf-fund/PKF_Fundamentals_PDF_013.jpg', pdf: 13, printed: 4, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  14: { src: './images/pkf-fund/PKF_Fundamentals_PDF_014.jpg', pdf: 14, printed: 5, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  15: { src: './images/pkf-fund/PKF_Fundamentals_PDF_015.jpg', pdf: 15, printed: 6, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  16: { src: './images/pkf-fund/PKF_Fundamentals_PDF_016.jpg', pdf: 16, printed: 7, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  17: { src: './images/pkf-fund/PKF_Fundamentals_PDF_017.jpg', pdf: 17, printed: 8, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  18: { src: './images/pkf-fund/PKF_Fundamentals_PDF_018.jpg', pdf: 18, printed: 9, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  19: { src: './images/pkf-fund/PKF_Fundamentals_PDF_019.jpg', pdf: 19, printed: 10, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  20: { src: './images/pkf-fund/PKF_Fundamentals_PDF_020.jpg', pdf: 20, printed: 11, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  21: { src: './images/pkf-fund/PKF_Fundamentals_PDF_021.jpg', pdf: 21, printed: 12, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  22: { src: './images/pkf-fund/PKF_Fundamentals_PDF_022.jpg', pdf: 22, printed: 13, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  23: { src: './images/pkf-fund/PKF_Fundamentals_PDF_023.jpg', pdf: 23, printed: null, kind: 'divider', w: 970, h: 1258, view: { x: 0, y: 0, w: 1, h: 1 } },
  24: { src: './images/pkf-fund/PKF_Fundamentals_PDF_024.jpg', pdf: 24, printed: null, kind: 'blank', w: 970, h: 1258, view: { x: 0, y: 0, w: 1, h: 1 } },
  25: { src: './images/pkf-fund/PKF_Fundamentals_PDF_025.jpg', pdf: 25, printed: 14, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  26: { src: './images/pkf-fund/PKF_Fundamentals_PDF_026.jpg', pdf: 26, printed: 15, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  27: { src: './images/pkf-fund/PKF_Fundamentals_PDF_027.jpg', pdf: 27, printed: 16, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  28: { src: './images/pkf-fund/PKF_Fundamentals_PDF_028.jpg', pdf: 28, printed: 17, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  29: { src: './images/pkf-fund/PKF_Fundamentals_PDF_029.jpg', pdf: 29, printed: 18, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  30: { src: './images/pkf-fund/PKF_Fundamentals_PDF_030.jpg', pdf: 30, printed: 19, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  31: { src: './images/pkf-fund/PKF_Fundamentals_PDF_031.jpg', pdf: 31, printed: 20, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  32: { src: './images/pkf-fund/PKF_Fundamentals_PDF_032.jpg', pdf: 32, printed: 21, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  33: { src: './images/pkf-fund/PKF_Fundamentals_PDF_033.jpg', pdf: 33, printed: 22, kind: 'content', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
  34: { src: './images/pkf-fund/PKF_Fundamentals_PDF_034.jpg', pdf: 34, printed: null, kind: 'blank', w: 807, h: 1152, view: { x: 0, y: 0, w: 1, h: 1 } },
};

/** Named crop regions (fractions of the page). '(photo)' regions exclude printed captions and body text. */
export const REGIONS = {
  'p11-txt': { page: 11, crop: { x: 0.0556, y: 0.4961, w: 0.9028, h: 0.4475 }, figs: 'Page 2 · ghost ball text + figure 1-1' },
  'p11-f1': { page: 11, crop: { x: 0.0722, y: 0.5691, w: 0.2917, h: 0.3696 }, figs: 'Figure 1-1' },
  'p11-full': { page: 11, crop: { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, figs: 'Page 2' },
  'p12-txt': { page: 12, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.107 }, figs: 'Page 3 · straight-in shooting line' },
  'p12-f2': { page: 12, crop: { x: 0.0722, y: 0.1459, w: 0.425, h: 0.1848 }, figs: 'Figure 1-2' },
  'p12-f3': { page: 12, crop: { x: 0.5, y: 0.1459, w: 0.425, h: 0.1848 }, figs: 'Figure 1-3' },
  'p12-f23': { page: 12, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.2918 }, figs: 'Page 3 · figures 1-2, 1-3' },
  'p12-f4': { page: 12, crop: { x: 0.0556, y: 0.3453, w: 0.9028, h: 0.2335 }, figs: 'Figure 1-4' },
  'p12-feet': { page: 12, crop: { x: 0.125, y: 0.5788, w: 0.7361, h: 0.3502 }, figs: 'Page 3 · foot positions' },
  'p12-feet-b90': { page: 12, crop: { x: 0.5, y: 0.5817, w: 0.35, h: 0.1401 }, figs: 'Foot photo (caption hidden)' },
  'p12-feet-fst': { page: 12, crop: { x: 0.5, y: 0.7617, w: 0.35, h: 0.1401 }, figs: 'Foot photo (caption hidden)' },
  'p12-feet-bst': { page: 12, crop: { x: 0.1347, y: 0.5817, w: 0.35, h: 0.1401 }, figs: 'Foot photo (caption hidden)' },
  'p13-legs': { page: 13, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.2578 }, figs: 'Page 4 · figures 1-5, 1-6' },
  'p13-f6': { page: 13, crop: { x: 0.5069, y: 0.1119, w: 0.4153, h: 0.1683 }, figs: 'Figure 1-6 (photo)' },
  'p13-issues': { page: 13, crop: { x: 0.0556, y: 0.2918, w: 0.9028, h: 0.3891 }, figs: 'Page 4 · stance issues 1-7, 1-8' },
  'p13-f9': { page: 13, crop: { x: 0.0722, y: 0.6907, w: 0.5667, h: 0.2286 }, figs: 'Figure 1-9 (photo)' },
  'p13-f9t': { page: 13, crop: { x: 0.0556, y: 0.6858, w: 0.9028, h: 0.2529 }, figs: 'Page 4 · figure 1-9' },
  'p14-arm': { page: 14, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.3405 }, figs: 'Page 5 · figures 1-10, 1-11' },
  'p14-f10': { page: 14, crop: { x: 0.0722, y: 0.1916, w: 0.4222, h: 0.1693 }, figs: 'Figure 1-10 (photo)' },
  'p14-fore': { page: 14, crop: { x: 0.0556, y: 0.3696, w: 0.9028, h: 0.2967 }, figs: 'Page 5 · figures 1-12, 1-13' },
  'p14-f13': { page: 14, crop: { x: 0.5028, y: 0.4767, w: 0.4194, h: 0.1683 }, figs: 'Figure 1-13 (photo)' },
  'p14-grip': { page: 14, crop: { x: 0.0556, y: 0.6712, w: 0.9028, h: 0.2772 }, figs: 'Page 5 · figure 1-14' },
  'p15-hand': { page: 15, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.2967 }, figs: 'Page 6 · figures 1-15, 1-16' },
  'p15-f15': { page: 15, crop: { x: 0.0722, y: 0.1527, w: 0.4222, h: 0.1693 }, figs: 'Figure 1-15 (photo)' },
  'p15-thumb': { page: 15, crop: { x: 0.0556, y: 0.3356, w: 0.9028, h: 0.3453 }, figs: 'Page 6 · thumb + grip pressure' },
  'p15-slide': { page: 15, crop: { x: 0.0556, y: 0.6809, w: 0.9028, h: 0.2578 }, figs: 'Page 6 · figures 1-17, 1-18' },
  'p16-pos': { page: 16, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.2481 }, figs: 'Page 7 · figures 1-19, 1-20' },
  'p16-f19': { page: 16, crop: { x: 0.0722, y: 0.1089, w: 0.4222, h: 0.1683 }, figs: 'Figure 1-19 (photo)' },
  'p16-back': { page: 16, crop: { x: 0.0556, y: 0.287, w: 0.9028, h: 0.2578 }, figs: 'Page 7 · back stroke + pause' },
  'p16-fwd': { page: 16, crop: { x: 0.0556, y: 0.5253, w: 0.9028, h: 0.4232 }, figs: 'Page 7 · forward stroke + follow through' },
  'p17-ft': { page: 17, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.2724 }, figs: 'Page 8 · figures 1-21, 1-22' },
  'p17-f22': { page: 17, crop: { x: 0.5, y: 0.1313, w: 0.4222, h: 0.1683 }, figs: 'Figure 1-22 (photo)' },
  'p17-elbow': { page: 17, crop: { x: 0.0556, y: 0.3113, w: 0.9028, h: 0.6469 }, figs: 'Page 8 · tightening + moving parts' },
  'p18-elbow': { page: 18, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.0973 }, figs: 'Page 9 · elbow drop' },
  'p18-tip': { page: 18, crop: { x: 0.0556, y: 0.1265, w: 0.9028, h: 0.4183 }, figs: 'Page 9 · figures 1-24, 1-25' },
  'p18-f24': { page: 18, crop: { x: 0.0722, y: 0.3084, w: 0.4222, h: 0.1712 }, figs: 'Figure 1-24 (photo)' },
  'p18-eyes': { page: 18, crop: { x: 0.0556, y: 0.4864, w: 0.9028, h: 0.4621 }, figs: 'Page 9 · tip distance + eyes' },
  'p19-steps': { page: 19, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.5691 }, figs: 'Page 10 · the steps, figures 1-27 to 1-29' },
  'p19-drill': { page: 19, crop: { x: 0.0556, y: 0.5204, w: 0.9028, h: 0.428 }, figs: 'Page 10 · stroke drill, figures 1-30, 1-31' },
  'p20-monitor': { page: 20, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.2967 }, figs: 'Page 11 · what to monitor' },
  'p20-head': { page: 20, crop: { x: 0.0556, y: 0.3356, w: 0.9028, h: 0.2626 }, figs: 'Page 11 · head movement, figure 1-32' },
  'p20-felt': { page: 20, crop: { x: 0.0556, y: 0.5992, w: 0.9028, h: 0.3492 }, figs: 'Page 11 · felt line drill, figure 1-33' },
  'p20-f32': { page: 20, crop: { x: 0.0722, y: 0.4066, w: 0.4222, h: 0.1751 }, figs: 'Figure 1-32 (photo)' },
  'p21-memory': { page: 21, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.2918 }, figs: 'Page 12 · muscle memory' },
  'p21-steps': { page: 21, crop: { x: 0.0556, y: 0.3307, w: 0.9028, h: 0.3502 }, figs: 'Page 12 · learn the game in steps' },
  'p21-story': { page: 21, crop: { x: 0.0556, y: 0.6761, w: 0.9028, h: 0.2967 }, figs: 'Page 12 · crooked stroke example' },
  'p22-all': { page: 22, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.428 }, figs: 'Page 13 · all aspects of the game' },
  'p25-intro': { page: 25, crop: { x: 0.0556, y: 0.4912, w: 0.9028, h: 0.4718 }, figs: 'Page 14 · figures 2-1, 2-2, side shot' },
  'p25-quote': { page: 25, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.3113 }, figs: 'Page 14 · chapter opener' },
  'p26-side': { page: 26, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.2091 }, figs: 'Page 15 · figures 2-3, 2-4' },
  'p26-f4': { page: 26, crop: { x: 0.5, y: 0.07, w: 0.4222, h: 0.1663 }, figs: 'Figure 2-4 (photo)' },
  'p26-stretch': { page: 26, crop: { x: 0.0556, y: 0.2481, w: 0.9028, h: 0.3016 }, figs: 'Page 15 · figures 2-5, 2-6' },
  'p26-f5': { page: 26, crop: { x: 0.0722, y: 0.3716, w: 0.4222, h: 0.1644 }, figs: 'Figure 2-5 (photo)' },
  'p26-rail': { page: 26, crop: { x: 0.0556, y: 0.5447, w: 0.9028, h: 0.3891 }, figs: 'Page 15 · figures 2-7, 2-8' },
  'p26-f8': { page: 26, crop: { x: 0.5, y: 0.6683, w: 0.4222, h: 0.1693 }, figs: 'Figure 2-8 (photo)' },
  'p27-sit': { page: 27, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.2967 }, figs: 'Page 16 · figures 2-9 to 2-12 (top)' },
  'p27-sit2': { page: 27, crop: { x: 0.0556, y: 0.2335, w: 0.9028, h: 0.287 }, figs: 'Page 16 · figures 2-11, 2-12' },
  'p27-knee': { page: 27, crop: { x: 0.0556, y: 0.5204, w: 0.9028, h: 0.2626 }, figs: 'Page 16 · figures 2-13, 2-14' },
  'p27-f14': { page: 27, crop: { x: 0.5, y: 0.5953, w: 0.4222, h: 0.1712 }, figs: 'Figure 2-14 (photo)' },
  'p27-bridges': { page: 27, crop: { x: 0.0556, y: 0.7831, w: 0.9028, h: 0.1897 }, figs: 'Page 16 · bridges intro' },
  'p28-open': { page: 28, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.2821 }, figs: 'Page 17 · figures 2-15, 2-16' },
  'p28-f15': { page: 28, crop: { x: 0.0722, y: 0.1313, w: 0.4222, h: 0.1683 }, figs: 'Figure 2-15 (photo)' },
  'p28-closed': { page: 28, crop: { x: 0.0556, y: 0.3161, w: 0.9028, h: 0.3453 }, figs: 'Page 17 · figures 2-17, 2-18' },
  'p28-f17': { page: 28, crop: { x: 0.0722, y: 0.4708, w: 0.4222, h: 0.1673 }, figs: 'Figure 2-17 (photo)' },
  'p28-f18': { page: 28, crop: { x: 0.5, y: 0.4708, w: 0.4222, h: 0.1673 }, figs: 'Figure 2-18 (photo)' },
  'p28-f19': { page: 28, crop: { x: 0.0722, y: 0.6829, w: 0.4472, h: 0.1809 }, figs: 'Figure 2-19 (photo)' },
  'p28-f19t': { page: 28, crop: { x: 0.0556, y: 0.6615, w: 0.9028, h: 0.2967 }, figs: 'Page 17 · figure 2-19, tripod intro' },
  'p29-tripod': { page: 29, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.1994 }, figs: 'Page 18 · figures 2-20, 2-21' },
  'p29-f20': { page: 29, crop: { x: 0.0722, y: 0.0506, w: 0.4222, h: 0.1683 }, figs: 'Figure 2-20 (photo)' },
  'p29-f21': { page: 29, crop: { x: 0.5, y: 0.0506, w: 0.4222, h: 0.1683 }, figs: 'Figure 2-21 (photo)' },
  'p29-over': { page: 29, crop: { x: 0.0556, y: 0.2335, w: 0.9028, h: 0.3307 }, figs: 'Page 18 · figures 2-22, 2-23' },
  'p29-f22': { page: 29, crop: { x: 0.0722, y: 0.3765, w: 0.4222, h: 0.1712 }, figs: 'Figure 2-22 (photo)' },
  'p29-far': { page: 29, crop: { x: 0.0556, y: 0.5642, w: 0.9028, h: 0.394 }, figs: 'Page 18 · figures 2-24, 2-25, rail bridge' },
  'p29-f24': { page: 29, crop: { x: 0.0722, y: 0.7121, w: 0.4222, h: 0.1712 }, figs: 'Figure 2-24 (photo)' },
  'p30-rail1': { page: 30, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.2821 }, figs: 'Page 19 · figures 2-26, 2-27' },
  'p30-rail2': { page: 30, crop: { x: 0.0556, y: 0.3161, w: 0.9028, h: 0.3551 }, figs: 'Page 19 · figures 2-28, 2-29' },
  'p30-f28': { page: 30, crop: { x: 0.0722, y: 0.4883, w: 0.4222, h: 0.1683 }, figs: 'Figure 2-28 (photo)' },
  'p30-f29': { page: 30, crop: { x: 0.5, y: 0.4883, w: 0.4222, h: 0.1683 }, figs: 'Figure 2-29 (photo)' },
  'p30-back': { page: 30, crop: { x: 0.0556, y: 0.6712, w: 0.9028, h: 0.2772 }, figs: 'Page 19 · figures 2-30, 2-31' },
  'p30-f30': { page: 30, crop: { x: 0.0722, y: 0.6877, w: 0.3347, h: 0.1342 }, figs: 'Figure 2-30 (photo)' },
  'p31-dist': { page: 31, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.2724 }, figs: 'Page 20 · figures 2-32, 2-33' },
  'p31-f32': { page: 31, crop: { x: 0.0722, y: 0.1284, w: 0.4222, h: 0.1712 }, figs: 'Figure 2-32 (photo)' },
  'p31-level': { page: 31, crop: { x: 0.0556, y: 0.3113, w: 0.9028, h: 0.3064 }, figs: 'Page 20 · figures 2-34, 2-35' },
  'p31-side': { page: 31, crop: { x: 0.0556, y: 0.6177, w: 0.9028, h: 0.3307 }, figs: 'Page 20 · figures 2-36, 2-37' },
  'p31-f37': { page: 31, crop: { x: 0.5111, y: 0.7656, w: 0.4111, h: 0.1615 }, figs: 'Figure 2-37 (photo)' },
  'p32-along': { page: 32, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.535 }, figs: 'Page 21 · figures 2-38 to 2-41' },
  'p32-f39': { page: 32, crop: { x: 0.5, y: 0.1479, w: 0.4222, h: 0.1712 }, figs: 'Figure 2-39 (photo)' },
  'p32-f40': { page: 32, crop: { x: 0.0722, y: 0.3881, w: 0.4222, h: 0.1693 }, figs: 'Figure 2-40 (photo)' },
  'p32-frozen': { page: 32, crop: { x: 0.0556, y: 0.5739, w: 0.9028, h: 0.3016 }, figs: 'Page 21 · figures 2-42, 2-43' },
  'p32-f43': { page: 32, crop: { x: 0.5, y: 0.6897, w: 0.4222, h: 0.1693 }, figs: 'Figure 2-43 (photo)' },
  'p32-practice': { page: 32, crop: { x: 0.0556, y: 0.8706, w: 0.9028, h: 0.0875 }, figs: 'Page 21 · practice awkward positions' },
  'p33-practice': { page: 33, crop: { x: 0.0556, y: 0.0389, w: 0.9028, h: 0.2529 }, figs: 'Page 22 · figure 2-44' },
  'p13-f7': { page: 13, crop: { x: 0.0722, y: 0.4961, w: 0.4222, h: 0.1673 }, figs: 'Figure 1-7 (photo)' },
  'p13-f8': { page: 13, crop: { x: 0.5028, y: 0.4961, w: 0.4194, h: 0.1673 }, figs: 'Figure 1-8 (photo)' },
  'p14-armpair': { page: 14, crop: { x: 0.0722, y: 0.1916, w: 0.85, h: 0.1839 }, figs: 'Figures 1-10, 1-11' },
  'p14-forepair': { page: 14, crop: { x: 0.0722, y: 0.4767, w: 0.85, h: 0.1829 }, figs: 'Figures 1-12, 1-13' },
  'p14-f14': { page: 14, crop: { x: 0.0722, y: 0.7091, w: 0.5556, h: 0.2228 }, figs: 'Figure 1-14 (photo)' },
  'p15-handpair': { page: 15, crop: { x: 0.0722, y: 0.1527, w: 0.85, h: 0.1829 }, figs: 'Figures 1-15, 1-16' },
  'p17-ftpair': { page: 17, crop: { x: 0.0722, y: 0.1313, w: 0.85, h: 0.1858 }, figs: 'Figures 1-21, 1-22' },
  'p18-fchalk': { page: 18, crop: { x: 0.0722, y: 0.5477, w: 0.5222, h: 0.2091 }, figs: 'Page 9 · tip and chalk photo' },
  'p19-f27': { page: 19, crop: { x: 0.0722, y: 0.1732, w: 0.4222, h: 0.1673 }, figs: 'Figure 1-27 (photo)' },
  'p19-f29': { page: 19, crop: { x: 0.0722, y: 0.43, w: 0.4306, h: 0.1712 }, figs: 'Figure 1-29 (photo)' },
  'p25-f1': { page: 25, crop: { x: 0.0722, y: 0.6469, w: 0.4222, h: 0.1722 }, figs: 'Figure 2-1 (photo)' },
  'p27-f11': { page: 27, crop: { x: 0.0722, y: 0.3375, w: 0.4222, h: 0.1683 }, figs: 'Figure 2-11 (photo)' },
  'p28-f16': { page: 28, crop: { x: 0.5, y: 0.1313, w: 0.4222, h: 0.1683 }, figs: 'Figure 2-16 (photo)' },
  'p29-overpair': { page: 29, crop: { x: 0.0722, y: 0.3765, w: 0.85, h: 0.1877 }, figs: 'Figures 2-22, 2-23' },
  'p30-f26': { page: 30, crop: { x: 0.0722, y: 0.1313, w: 0.4222, h: 0.1683 }, figs: 'Figure 2-26 (photo)' },
};

/** lessonId → figure. purpose: teaching | reference | question | answer | practice.
 * question figures are photo-only crops (printed captions/answers hidden); reveal = PKF page region shown after LOCK.
 * textOnlyUntilLock: the only figure would print the answer, so the question is asked text-only and the figure appears after LOCK. */
export const ASSET_MAP = {
  'sl-ghost': { fig: 'p11-txt', purpose: 'teaching' },
  'sl-straight': { fig: 'p12-f23', purpose: 'teaching' },
  'sl-q-ghost': { fig: 'p11-f1', purpose: 'question', reveal: 'p11-txt' },
  'sl-seq': { fig: 'p11-f1', purpose: 'question', reveal: 'p11-txt' },
  'sl-q-straight': { fig: 'p12-f3', purpose: 'question', reveal: 'p12-txt' },
  'st-feet': { fig: 'p12-f4', purpose: 'teaching', also: ['p12-feet'] },
  'st-id-back90': { fig: 'p12-feet-b90', purpose: 'question', reveal: 'p12-feet' },
  'st-id-front': { fig: 'p12-feet-fst', purpose: 'question', reveal: 'p12-feet' },
  'st-legs': { fig: 'p13-legs', purpose: 'teaching' },
  'st-id-legs': { fig: 'p13-f6', purpose: 'question', reveal: 'p13-legs' },
  'st-issues': { fig: 'p13-issues', purpose: 'teaching' },
  'st-q-toofar': { fig: 'p13-f7', purpose: 'question', reveal: 'p13-issues' },
  'st-id-crossed': { fig: 'p13-f9', purpose: 'question', reveal: 'p13-f9t' },
  'st-arm': { fig: 'p14-arm', purpose: 'teaching' },
  'st-q-aim': { fig: 'p14-armpair', purpose: 'question', reveal: 'p14-arm' },
  'st-practice': { fig: 'p12-f4', purpose: 'practice', also: ['p12-feet'] },
  'fg-forearm': { fig: 'p14-fore', purpose: 'teaching' },
  'fg-id-forearm': { fig: 'p14-forepair', purpose: 'question', reveal: 'p14-fore' },
  'fg-grip': { fig: 'p14-grip', purpose: 'teaching' },
  'fg-hand': { fig: 'p15-hand', purpose: 'teaching' },
  'fg-id-hand': { fig: 'p15-handpair', purpose: 'question', reveal: 'p15-hand' },
  'fg-pressure': { fig: 'p15-thumb', purpose: 'teaching' },
  'fg-q-thumb': { fig: 'p14-f14', purpose: 'question', reveal: 'p15-thumb' },
  'fg-q-pressure': { fig: 'p14-f14', purpose: 'question', reveal: 'p15-thumb' },
  'fg-q-goal': { fig: 'p14-f14', purpose: 'question', reveal: 'p15-thumb' },
  'fg-practice': { fig: 'p15-hand', purpose: 'practice' },
  'sk-slide': { fig: 'p15-slide', purpose: 'teaching' },
  'sk-id-grip': { fig: 'p16-f19', purpose: 'question', reveal: 'p16-pos' },
  'sk-back': { fig: 'p16-back', purpose: 'teaching' },
  'sk-q-tempo': { fig: 'p16-back', purpose: 'question', textOnlyUntilLock: true },
  'sk-q-pause': { fig: 'p16-back', purpose: 'question', textOnlyUntilLock: true },
  'sk-forward': { fig: 'p16-fwd', purpose: 'teaching' },
  'sk-id-follow': { fig: 'p17-ftpair', purpose: 'question', reveal: 'p17-ft' },
  'sk-q-tight': { fig: 'p17-f22', purpose: 'question', reveal: 'p17-elbow' },
  'sk-elbow': { fig: 'p17-elbow', purpose: 'teaching', also: ['p18-elbow'] },
  'sk-q-parts': { fig: 'p17-elbow', purpose: 'question', textOnlyUntilLock: true },
  'sk-practice': { fig: 'p17-ft', purpose: 'practice' },
  'te-tip': { fig: 'p18-tip', purpose: 'teaching' },
  'te-id-tip': { fig: 'p18-f24', purpose: 'question', reveal: 'p18-tip' },
  'te-q-chalk': { fig: 'p18-eyes', purpose: 'question', textOnlyUntilLock: true },
  'te-eyes': { fig: 'p18-eyes', purpose: 'teaching' },
  'te-q-eyes': { fig: 'p18-eyes', purpose: 'question', textOnlyUntilLock: true },
  'sd-steps': { fig: 'p19-steps', purpose: 'teaching' },
  'sd-seq': { fig: 'p19-steps', purpose: 'question', textOnlyUntilLock: true },
  'sd-q-bridge': { fig: 'p19-f27', purpose: 'question', reveal: 'p19-steps' },
  'sd-id-tripod': { fig: 'p19-f29', purpose: 'question', reveal: 'p19-steps' },
  'sd-drill': { fig: 'p19-drill', purpose: 'teaching' },
  'sd-monitor': { fig: 'p20-monitor', purpose: 'teaching' },
  'sd-q-head': { fig: 'p20-head', purpose: 'question', textOnlyUntilLock: true },
  'sd-felt': { fig: 'p20-felt', purpose: 'teaching' },
  'sd-id-flaw': { fig: 'p20-f32', purpose: 'question', reveal: 'p20-head' },
  'sd-practice-drill': { fig: 'p19-drill', purpose: 'practice' },
  'sd-practice-felt': { fig: 'p20-felt', purpose: 'practice' },
  'sd-practice-oneball': { fig: 'p21-steps', purpose: 'practice' },
  'sm-memory': { fig: 'p21-memory', purpose: 'teaching' },
  'sm-q-ready': { fig: 'p21-memory', purpose: 'question', textOnlyUntilLock: true },
  'sm-steps': { fig: 'p21-steps', purpose: 'teaching' },
  'sm-seq': { fig: 'p21-steps', purpose: 'question', textOnlyUntilLock: true },
  'sm-q-move': { fig: 'p21-steps', purpose: 'question', textOnlyUntilLock: true },
  'sm-story': { fig: 'p21-story', purpose: 'teaching' },
  'sm-q-story': { fig: 'p21-story', purpose: 'question', textOnlyUntilLock: true },
  'sm-all': { fig: 'p22-all', purpose: 'reference' },
  'bs-choices': { fig: 'p25-intro', purpose: 'teaching' },
  'bs-q-choose': { fig: 'p25-f1', purpose: 'question', reveal: 'p25-intro' },
  'bs-id-side': { fig: 'p26-f4', purpose: 'question', reveal: 'p26-side' },
  'bs-q-time': { fig: 'p25-intro', purpose: 'question', textOnlyUntilLock: true },
  'bs-stretch': { fig: 'p26-stretch', purpose: 'teaching' },
  'bs-sit': { fig: 'p26-rail', purpose: 'teaching', also: ['p27-sit'] },
  'bs-q-sit': { fig: 'p27-f11', purpose: 'question', reveal: 'p27-sit2' },
  'bs-knee': { fig: 'p27-knee', purpose: 'teaching' },
  'bs-id-knee': { fig: 'p27-f14', purpose: 'question', reveal: 'p27-knee' },
  'bs-practice': { fig: 'p33-practice', purpose: 'practice' },
  'oc-open': { fig: 'p28-open', purpose: 'teaching' },
  'oc-id-open': { fig: 'p28-f15', purpose: 'question', reveal: 'p28-open' },
  'oc-q-raise': { fig: 'p28-f15', purpose: 'question', reveal: 'p28-open' },
  'oc-q-benefit': { fig: 'p28-open', purpose: 'question', textOnlyUntilLock: true },
  'oc-closed': { fig: 'p28-closed', purpose: 'teaching' },
  'oc-id-closed': { fig: 'p28-f17', purpose: 'question', reveal: 'p28-closed' },
  'oc-id-thumb': { fig: 'p28-f19', purpose: 'question', reveal: 'p28-f19t' },
  'oc-practice-open': { fig: 'p28-open', purpose: 'practice' },
  'oc-practice-closed': { fig: 'p28-closed', purpose: 'practice' },
  'tr-learn': { fig: 'p29-tripod', purpose: 'teaching' },
  'tr-id-closed': { fig: 'p29-f20', purpose: 'question', reveal: 'p29-tripod' },
  'tr-id-open': { fig: 'p29-f21', purpose: 'question', reveal: 'p29-tripod' },
  'tr-over': { fig: 'p29-over', purpose: 'teaching' },
  'tr-id-support': { fig: 'p29-overpair', purpose: 'question', reveal: 'p29-over' },
  'tr-id-far': { fig: 'p29-f24', purpose: 'question', reveal: 'p29-far' },
  'tr-practice': { fig: 'p29-over', purpose: 'practice' },
  'rb-common': { fig: 'p30-rail1', purpose: 'teaching' },
  'rb-q-open': { fig: 'p30-f26', purpose: 'question', reveal: 'p30-rail1' },
  'rb-most': { fig: 'p30-rail2', purpose: 'teaching' },
  'rb-seq': { fig: 'p30-f28', purpose: 'question', reveal: 'p30-rail2' },
  'rb-id-thumb': { fig: 'p30-f29', purpose: 'question', reveal: 'p30-rail2' },
  'rb-back': { fig: 'p30-back', purpose: 'teaching' },
  'rb-id-close': { fig: 'p30-f30', purpose: 'question', reveal: 'p30-back' },
  'rb-dist': { fig: 'p31-dist', purpose: 'teaching', also: ['p31-level'] },
  'rb-q-dist': { fig: 'p31-f32', purpose: 'question', reveal: 'p31-dist' },
  'rb-practice': { fig: 'p30-rail2', purpose: 'practice' },
  'ts-side': { fig: 'p31-side', purpose: 'teaching' },
  'ts-id-side': { fig: 'p31-f37', purpose: 'question', reveal: 'p31-side' },
  'ts-along': { fig: 'p32-along', purpose: 'teaching' },
  'ts-id-along': { fig: 'p32-f39', purpose: 'question', reveal: 'p32-along' },
  'ts-frozen': { fig: 'p32-frozen', purpose: 'teaching' },
  'ts-q-frozen': { fig: 'p32-frozen', purpose: 'question', textOnlyUntilLock: true },
  'ts-practice-tight': { fig: 'p32-along', purpose: 'practice' },
  'ts-practice-awkward': { fig: 'p33-practice', purpose: 'practice' },
  'fx-ghost': { fig: 'p11-txt', purpose: 'question', textOnlyUntilLock: true },
  'fx-seq-line': { fig: 'p11-f1', purpose: 'question', reveal: 'p11-txt' },
  'fx-id-feet': { fig: 'p12-feet-bst', purpose: 'question', reveal: 'p12-feet' },
  'fx-id-away': { fig: 'p13-f8', purpose: 'question', reveal: 'p13-issues' },
  'fx-aim': { fig: 'p14-arm', purpose: 'question', textOnlyUntilLock: true },
  'fx-id-forearm': { fig: 'p14-forepair', purpose: 'question', reveal: 'p14-fore' },
  'fx-thumb': { fig: 'p14-f14', purpose: 'question', reveal: 'p14-grip' },
  'fx-tempo': { fig: 'p16-back', purpose: 'question', textOnlyUntilLock: true },
  'fx-id-follow': { fig: 'p17-ftpair', purpose: 'question', reveal: 'p17-ft' },
  'fx-parts': { fig: 'p17-elbow', purpose: 'question', textOnlyUntilLock: true },
  'fx-chalk': { fig: 'p18-eyes', purpose: 'question', textOnlyUntilLock: true },
  'fx-seq-steps': { fig: 'p19-steps', purpose: 'question', textOnlyUntilLock: true },
  'fx-head': { fig: 'p20-head', purpose: 'question', textOnlyUntilLock: true },
  'fx-steps': { fig: 'p21-steps', purpose: 'question', textOnlyUntilLock: true },
  'fx-id-raised': { fig: 'p28-f16', purpose: 'question', reveal: 'p28-open' },
  'fx-id-tripod': { fig: 'p29-f21', purpose: 'question', reveal: 'p29-tripod' },
  'fx-id-support': { fig: 'p29-overpair', purpose: 'question', reveal: 'p29-over' },
  'fx-id-rail': { fig: 'p30-f28', purpose: 'question', reveal: 'p30-rail2' },
  'fx-id-close': { fig: 'p30-f30', purpose: 'question', reveal: 'p30-back' },
  'fx-frozen': { fig: 'p32-frozen', purpose: 'question', textOnlyUntilLock: true },
  'fx-id-sit': { fig: 'p26-f8', purpose: 'question', reveal: 'p26-rail' },
  'fx-x-drill': { fig: 'p19-drill', purpose: 'practice', also: ['p20-monitor'] },
  'fx-x-felt': { fig: 'p20-felt', purpose: 'practice' },
  'fx-x-bridges': { fig: 'p33-practice', purpose: 'practice' },
};

export function regionOf(key) {
  const r = REGIONS[key];
  if (!r) return null;
  const p = PAGES[r.page];
  return { key, ...r, sourceImage: p.src, pdf: p.pdf, printed: p.printed, w: p.w, h: p.h, view: p.view };
}

export function assetOf(lessonId) {
  const a = ASSET_MAP[lessonId];
  if (!a) return null;
  const fig = regionOf(a.fig);
  if (!fig) return null;
  return {
    ...fig,
    purpose: a.purpose,
    reveal: a.reveal ? regionOf(a.reveal) : null,
    also: (a.also || []).map(regionOf).filter(Boolean),
    textOnlyUntilLock: !!a.textOnlyUntilLock
  };
}

export function pageSrc(pdf) {
  return PAGES[Number(pdf)]?.src || null;
}

/** Every original file referenced by the course (for precache / tests). */
export function allPageSrcs() {
  return Object.values(PAGES).map((p) => p.src);
}

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Public citation text: printed page + figure numbers only. */
export function citeOf(r) {
  const page = r.printed != null ? `PKF page ${r.printed}` : `PKF PDF page ${r.pdf}`;
  const figs = String(r.figs || '').replace(/^Page \d+ · /, '').replace(/ \(photo\)/g, '').replace(/ \(caption hidden\)/g, '');
  return figs && !/^Page \d+$/.test(figs) ? `${page} · ${figs}` : page;
}

function cropSpan(r, alt) {
  const c = r.crop;
  const ar = (c.w * r.w) / (c.h * r.h);
  return `<span class="pkfbCrop pkffCrop" style="--cx:${c.x};--cy:${c.y};--cw:${c.w};--ch:${c.h};--ar:${ar.toFixed(4)}"><img src="${esc(r.sourceImage)}" alt="${esc(alt)}" width="${r.w}" height="${r.h}" decoding="async" draggable="false"/></span>`;
}

function enlargeAttrs(r, c) {
  return `data-src="${esc(r.sourceImage)}" data-w="${r.w}" data-h="${r.h}" data-cx="${c.x}" data-cy="${c.y}" data-cw="${c.w}" data-ch="${c.h}"`;
}

/** Original-JPEG region as a CSS viewport (aspect ratio from the crop; height-based positioning). */
export function regionHTML(r, { alt = 'PKF original page', fullBtn = true, label = '', noFull = false } = {}) {
  if (!r) return '<p class="muted">No source image for this lesson.</p>';
  const v = r.view;
  const btn = fullBtn && !noFull
    ? `<button type="button" class="chip pkfbFullBtn" data-action="pkff-enlarge" data-full="1" ${enlargeAttrs(r, v)}>VIEW FULL PKF PAGE</button>`
    : '';
  return `<div class="pkfbFig pkffFig" data-pkff-fig="${esc(r.key)}" data-page="${r.page}">
    ${label ? `<p class="pkfbFigLabel">${esc(label)}</p>` : ''}
    <button type="button" class="pkfbCropBtn" data-action="pkff-enlarge" ${enlargeAttrs(r, r.crop)} data-fx="${r.view.x}" data-fy="${r.view.y}" data-fw="${r.view.w}" data-fh="${r.view.h}"${noFull ? ' data-nofull="1"' : ''} aria-label="Enlarge PKF figure">${cropSpan(r, alt)}</button>
    <p class="pkfbCite muted small">${esc(citeOf(r))} · tap to enlarge</p>
    ${btn}
  </div>`;
}

export function figureHTML(lessonId, opts = {}) {
  const a = assetOf(lessonId);
  if (!a) return '<p class="muted">No source image for this lesson.</p>';
  if (a.textOnlyUntilLock && opts.hideUntilLock) {
    return `<div class="card pkffHiddenFig" data-pkff-hidden-fig="1"><p class="muted small">The PKF figure appears after you LOCK ANSWER (the printed page shows the answer).</p></div>`;
  }
  const extra = opts.withAlso ? a.also.map((r) => regionHTML(r, { ...opts, label: '' })).join('') : '';
  return regionHTML(a, opts) + extra;
}

export function revealFigureHTML(lessonId, opts = {}) {
  const a = assetOf(lessonId);
  if (!a) return '';
  if (a.reveal) return regionHTML(a.reveal, { label: 'PKF ORIGINAL PAGE', ...opts });
  if (a.textOnlyUntilLock) return regionHTML(a, { label: 'PKF ORIGINAL PAGE', ...opts });
  return '';
}
