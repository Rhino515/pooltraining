/**
 * Built-in PKF drill documents.
 * Each object is the .pooliq file in content/pkf/ verbatim (same strings, ids, categories, attribution).
 * Diamond coordinates are converted by validatePooliq when the drill library loads — this module does not rewrite them.
 */
export const PKF_DOCS = [
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Cue Ball Control",
    "difficulty": 1,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted for Pool IQ from the user-provided PKF handbook. Setup simplified to repeatable diamond-grid references without changing the lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "cue-ball-control",
        "draw",
        "diamonds",
        "progressive"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-draw-1d",
    "title": "PKF · Draw 1 Diamond",
    "description": "Pocket the object ball and draw the cue ball back 1 diamond.",
    "xp": 40,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.2
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 4,
        "dy": 2
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 4,
          "dy": 1
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 4,
          "dy": 2
        },
        {
          "x": 50,
          "y": 14.75
        },
        {
          "dx": 4,
          "dy": 2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4,
          "dy": 1
        },
        {
          "x": 50,
          "y": -1.45
        }
      ],
      "cueContact": {
        "vTips": -1,
        "hTips": 0
      },
      "technique": "draw",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 4,
          "dy": 2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "DRAW 1D"
        }
      ],
      "goal": "Pocket the 1-ball and draw the cue ball to the 1-diamond target.",
      "instructions": "Use a level stroke and low cue-ball contact. Increase stroke only as needed to reach the target.",
      "setupInstructions": "1-ball: center line at the 1-diamond line. Cue ball: same line at the 2-diamond line."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Cue Ball Control",
    "difficulty": 2,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted for Pool IQ from the user-provided PKF handbook. Setup simplified to repeatable diamond-grid references without changing the lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "cue-ball-control",
        "draw",
        "diamonds",
        "progressive"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-draw-2d",
    "title": "PKF · Draw 2 Diamonds",
    "description": "Pocket the object ball and draw the cue ball back 2 diamonds.",
    "xp": 40,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.2
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 4,
        "dy": 2
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 4,
          "dy": 1
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 4,
          "dy": 2
        },
        {
          "x": 50,
          "y": 14.75
        },
        {
          "dx": 4,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4,
          "dy": 1
        },
        {
          "x": 50,
          "y": -1.45
        }
      ],
      "cueContact": {
        "vTips": -1,
        "hTips": 0
      },
      "technique": "draw",
      "speed": 2.0,
      "targetZones": [
        {
          "dx": 4,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "DRAW 2D"
        }
      ],
      "goal": "Pocket the 1-ball and draw the cue ball to the 2-diamond target.",
      "instructions": "Use a level stroke and low cue-ball contact. Increase stroke only as needed to reach the target.",
      "setupInstructions": "1-ball: center line at the 1-diamond line. Cue ball: same line at the 2-diamond line."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Cue Ball Control",
    "difficulty": 2,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted for Pool IQ from the user-provided PKF handbook. Setup simplified to repeatable diamond-grid references without changing the lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "cue-ball-control",
        "draw",
        "diamonds",
        "progressive"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-draw-3d",
    "title": "PKF · Draw 3 Diamonds",
    "description": "Pocket the object ball and draw the cue ball back 3 diamonds.",
    "xp": 40,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.2
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 4,
        "dy": 2
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 4,
          "dy": 1
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 4,
          "dy": 2
        },
        {
          "x": 50,
          "y": 14.75
        },
        {
          "dx": 4,
          "dy": 4
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4,
          "dy": 1
        },
        {
          "x": 50,
          "y": -1.45
        }
      ],
      "cueContact": {
        "vTips": -1,
        "hTips": 0
      },
      "technique": "draw",
      "speed": 2.5,
      "targetZones": [
        {
          "dx": 4,
          "dy": 4,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "DRAW 3D"
        }
      ],
      "goal": "Pocket the 1-ball and draw the cue ball to the 3-diamond target.",
      "instructions": "Use a level stroke and low cue-ball contact. Increase stroke only as needed to reach the target.",
      "setupInstructions": "1-ball: center line at the 1-diamond line. Cue ball: same line at the 2-diamond line."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Cue Ball Control",
    "difficulty": 1,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted for Pool IQ from the user-provided PKF handbook. Setup simplified to repeatable diamond-grid references without changing the lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "cue-ball-control",
        "stop-shot",
        "low-spin",
        "progressive"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-stop-1",
    "title": "PKF · Stop Shot · Half Diamond",
    "description": "Pocket the object ball and stop the cue ball dead from half diamond away.",
    "xp": 40,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.2
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 4,
        "dy": 1.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 4,
          "dy": 1
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 4,
          "dy": 1.5
        },
        {
          "x": 50,
          "y": 14.75
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4,
          "dy": 1
        },
        {
          "x": 50,
          "y": -1.45
        }
      ],
      "cueContact": {
        "vTips": -0.75,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.0,
      "targetZones": [
        {
          "dx": 4,
          "dy": 1.02,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "STOP"
        }
      ],
      "goal": "Pocket the 1-ball and leave the cue ball stopped at contact.",
      "instructions": "Use low spin and the softest stroke that still leaves the cue ball sliding at impact. If it follows, reduce speed or use more low; if it draws back, use less low or adjust speed.",
      "setupInstructions": "1-ball: center line at the 1-diamond line. Cue ball: same line at 1.5 diamonds."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Cue Ball Control",
    "difficulty": 1,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted for Pool IQ from the user-provided PKF handbook. Setup simplified to repeatable diamond-grid references without changing the lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "cue-ball-control",
        "stop-shot",
        "low-spin",
        "progressive"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-stop-2",
    "title": "PKF · Stop Shot · 1 Diamond",
    "description": "Pocket the object ball and stop the cue ball dead from 1 diamond away.",
    "xp": 40,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.2
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 4,
        "dy": 2
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 4,
          "dy": 1
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 4,
          "dy": 2
        },
        {
          "x": 50,
          "y": 14.75
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4,
          "dy": 1
        },
        {
          "x": 50,
          "y": -1.45
        }
      ],
      "cueContact": {
        "vTips": -0.75,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 4,
          "dy": 1.02,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "STOP"
        }
      ],
      "goal": "Pocket the 1-ball and leave the cue ball stopped at contact.",
      "instructions": "Use low spin and the softest stroke that still leaves the cue ball sliding at impact. If it follows, reduce speed or use more low; if it draws back, use less low or adjust speed.",
      "setupInstructions": "1-ball: center line at the 1-diamond line. Cue ball: same line at 2 diamonds."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Cue Ball Control",
    "difficulty": 2,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted for Pool IQ from the user-provided PKF handbook. Setup simplified to repeatable diamond-grid references without changing the lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "cue-ball-control",
        "stop-shot",
        "low-spin",
        "progressive"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-stop-3",
    "title": "PKF · Stop Shot · 2 Diamonds",
    "description": "Pocket the object ball and stop the cue ball dead from 2 diamonds away.",
    "xp": 40,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.2
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 4,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 4,
          "dy": 1
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 4,
          "dy": 3
        },
        {
          "x": 50,
          "y": 14.75
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4,
          "dy": 1
        },
        {
          "x": 50,
          "y": -1.45
        }
      ],
      "cueContact": {
        "vTips": -0.75,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 4,
          "dy": 1.02,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "STOP"
        }
      ],
      "goal": "Pocket the 1-ball and leave the cue ball stopped at contact.",
      "instructions": "Use low spin and the softest stroke that still leaves the cue ball sliding at impact. If it follows, reduce speed or use more low; if it draws back, use less low or adjust speed.",
      "setupInstructions": "1-ball: center line at the 1-diamond line. Cue ball: same line at 3 diamonds."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Center Ball",
    "difficulty": 1,
    "skill": "Shot Making",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from the user-provided PKF handbook. Coordinates normalized to simple diamond-grid references where that preserves the lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "center-ball",
        "low-action",
        "stop-shot",
        "figure-3-52"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-low-action-straight-1",
    "title": "PKF · Low Action Straight · Near",
    "description": "Pocket the straight-in ball softly and keep the cue ball nearly still using maximum low.",
    "xp": 45,
    "skillEffects": {
      "Shot Making": 0.4,
      "Cue-Ball Control": 0.4
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 4,
        "dy": 2
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 4,
          "dy": 2
        },
        {
          "dx": 6,
          "dy": 2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": -1.5,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.0,
      "targetZones": [
        {
          "dx": 6,
          "dy": 2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "STOP"
        }
      ],
      "goal": "Pocket the 1-ball and leave the cue ball as close to the contact point as possible.",
      "instructions": "Use maximum low and a soft, level stroke. Once consistent, move to the next farther cue-ball position.",
      "setupInstructions": "Place both balls on the displayed straight diamond-grid line to the bottom-right corner."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Center Ball",
    "difficulty": 2,
    "skill": "Shot Making",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from the user-provided PKF handbook. Coordinates normalized to simple diamond-grid references where that preserves the lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "center-ball",
        "low-action",
        "stop-shot",
        "figure-3-52"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-low-action-straight-2",
    "title": "PKF · Low Action Straight · Mid",
    "description": "Pocket the straight-in ball softly and keep the cue ball nearly still using maximum low.",
    "xp": 45,
    "skillEffects": {
      "Shot Making": 0.4,
      "Cue-Ball Control": 0.4
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 3,
        "dy": 2
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 3,
          "dy": 2
        },
        {
          "dx": 6,
          "dy": 2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": -1.5,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 6,
          "dy": 2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "STOP"
        }
      ],
      "goal": "Pocket the 1-ball and leave the cue ball as close to the contact point as possible.",
      "instructions": "Use maximum low and a soft, level stroke. Once consistent, move to the next farther cue-ball position.",
      "setupInstructions": "Place both balls on the displayed straight diamond-grid line to the bottom-right corner."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Center Ball",
    "difficulty": 2,
    "skill": "Shot Making",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from the user-provided PKF handbook. Coordinates normalized to simple diamond-grid references where that preserves the lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "center-ball",
        "low-action",
        "stop-shot",
        "figure-3-52"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-low-action-straight-3",
    "title": "PKF · Low Action Straight · Far",
    "description": "Pocket the straight-in ball softly and keep the cue ball nearly still using maximum low.",
    "xp": 45,
    "skillEffects": {
      "Shot Making": 0.4,
      "Cue-Ball Control": 0.4
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 2,
        "dy": 2
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 2,
          "dy": 2
        },
        {
          "dx": 6,
          "dy": 2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": -1.5,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 6,
          "dy": 2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "STOP"
        }
      ],
      "goal": "Pocket the 1-ball and leave the cue ball as close to the contact point as possible.",
      "instructions": "Use maximum low and a soft, level stroke. Once consistent, move to the next farther cue-ball position.",
      "setupInstructions": "Place both balls on the displayed straight diamond-grid line to the bottom-right corner."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Center Ball",
    "difficulty": 2,
    "skill": "Shot Making",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from the user-provided PKF handbook. Coordinates normalized to simple diamond-grid references where that preserves the lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "center-ball",
        "throw",
        "cut-shot",
        "figure-3-58"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-center-ball-throw",
    "title": "PKF · Center Ball Throw",
    "description": "Pocket a cut shot with no sidespin while learning the small aim correction caused by throw.",
    "xp": 45,
    "skillEffects": {
      "Shot Making": 0.4,
      "Cue-Ball Control": 0.4
    },
    "shot": {
      "kind": "pot",
      "cueBallPosition": {
        "dx": 3,
        "dy": 2.5
      },
      "ballPositions": [
        {
          "n": 8,
          "dx": 4,
          "dy": 2
        }
      ],
      "targetBall": 8,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 3,
          "dy": 2.5
        },
        {
          "dx": 4,
          "dy": 2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4,
          "dy": 2
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "speed": 1.25,
      "goal": "Pocket the 8-ball using center ball and account for natural throw.",
      "instructions": "Use no sidespin. Refine the cut slightly thinner as needed to compensate for throw.",
      "setupInstructions": "8-ball: center-grid intersection. Cue ball: one diamond left and a half-diamond lower."
    },
    "scoringRules": {
      "mode": "success",
      "attempts": 10,
      "pass": {
        "made": 7
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Center Ball",
    "difficulty": 2,
    "skill": "Shot Making",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from the user-provided PKF handbook. Coordinates normalized to simple diamond-grid references where that preserves the lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "center-ball",
        "throw",
        "cut-shot",
        "figures-3-59-3-60"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-throw-right",
    "title": "PKF · Throw Cut · Right",
    "description": "Practice a right cut with center ball and learn the small aim correction caused by throw.",
    "xp": 45,
    "skillEffects": {
      "Shot Making": 0.4,
      "Cue-Ball Control": 0.4
    },
    "shot": {
      "kind": "pot",
      "cueBallPosition": {
        "dx": 2,
        "dy": 2
      },
      "ballPositions": [
        {
          "n": 3,
          "dx": 5,
          "dy": 3
        }
      ],
      "targetBall": 3,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 2,
          "dy": 2
        },
        {
          "dx": 5,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5,
          "dy": 3
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "speed": 1.25,
      "goal": "Pocket the 3-ball cleanly with center ball.",
      "instructions": "Shoot without sidespin. Refine the cut slightly thinner as needed to compensate for throw into the pocket opening.",
      "setupInstructions": "Use the displayed full-diamond grid intersections so the shot can be reproduced exactly."
    },
    "scoringRules": {
      "mode": "success",
      "attempts": 10,
      "pass": {
        "made": 7
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Center Ball",
    "difficulty": 2,
    "skill": "Shot Making",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from the user-provided PKF handbook. Coordinates normalized to simple diamond-grid references where that preserves the lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "center-ball",
        "throw",
        "cut-shot",
        "figures-3-59-3-60"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-throw-left",
    "title": "PKF · Throw Cut · Left",
    "description": "Practice a left cut with center ball and learn the small aim correction caused by throw.",
    "xp": 45,
    "skillEffects": {
      "Shot Making": 0.4,
      "Cue-Ball Control": 0.4
    },
    "shot": {
      "kind": "pot",
      "cueBallPosition": {
        "dx": 6,
        "dy": 2
      },
      "ballPositions": [
        {
          "n": 3,
          "dx": 3,
          "dy": 3
        }
      ],
      "targetBall": 3,
      "targetPocket": "BL",
      "cueBallPath": [
        {
          "dx": 6,
          "dy": 2
        },
        {
          "dx": 3,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 3,
          "dy": 3
        },
        {
          "x": 0,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "speed": 1.25,
      "goal": "Pocket the 3-ball cleanly with center ball.",
      "instructions": "Shoot without sidespin. Refine the cut slightly thinner as needed to compensate for throw into the pocket opening.",
      "setupInstructions": "Use the displayed full-diamond grid intersections so the shot can be reproduced exactly."
    },
    "scoringRules": {
      "mode": "success",
      "attempts": 10,
      "pass": {
        "made": 7
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Sliding Cue Ball",
    "difficulty": 2,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Four. Grid-friendly coordinates preserve the lesson and make setup repeatable."
    },
    "metadata": {
      "tags": [
        "pkf",
        "sliding-cue-ball",
        "stun",
        "figures-4-1-4-2",
        "tangent-line"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-follow-cut-demo",
    "title": "PKF · Rolling Cut",
    "description": "Compare rolling and sliding cue-ball behavior after a cut.",
    "xp": 50,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 3,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 8,
          "dx": 5,
          "dy": 2
        }
      ],
      "targetBall": 8,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 3,
          "dy": 3
        },
        {
          "dx": 5,
          "dy": 2
        },
        {
          "dx": 5.5,
          "dy": 3.5
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5,
          "dy": 2
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.75,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 5.5,
          "dy": 3.5,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "CB TARGET"
        }
      ],
      "goal": "Pocket the 8-ball and send the cue ball into the displayed target zone.",
      "instructions": "Use the displayed cue contact and consistent speed. Compare this route with the companion drill.",
      "setupInstructions": "Use the shown full/half-diamond grid references."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Sliding Cue Ball",
    "difficulty": 1,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Four. Grid-friendly coordinates preserve the lesson and make setup repeatable."
    },
    "metadata": {
      "tags": [
        "pkf",
        "sliding-cue-ball",
        "stun",
        "figures-4-1-4-2",
        "tangent-line"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-stun-cut-demo",
    "title": "PKF · Sliding 90° Cut",
    "description": "Compare rolling and sliding cue-ball behavior after a cut.",
    "xp": 50,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 3,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 8,
          "dx": 5,
          "dy": 2
        }
      ],
      "targetBall": 8,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 3,
          "dy": 3
        },
        {
          "dx": 5,
          "dy": 2
        },
        {
          "dx": 4,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5,
          "dy": 2
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 4,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "CB TARGET"
        }
      ],
      "goal": "Pocket the 8-ball and send the cue ball into the displayed target zone.",
      "instructions": "Use the displayed cue contact and consistent speed. Compare this route with the companion drill.",
      "setupInstructions": "Use the shown full/half-diamond grid references."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Sliding Cue Ball",
    "difficulty": 2,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Four. Grid-friendly coordinates preserve the lesson and make setup repeatable."
    },
    "metadata": {
      "tags": [
        "pkf",
        "sliding-cue-ball",
        "stun",
        "figures-4-3-4-4",
        "position"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-slide-3-to-8",
    "title": "PKF · Slide 3 to Shape on 8",
    "description": "Pocket the 3 in the side and use a sliding cue ball for shape on the 8.",
    "xp": 50,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 4,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 3,
          "dx": 4,
          "dy": 2
        },
        {
          "n": 8,
          "dx": 6,
          "dy": 2
        }
      ],
      "targetBall": 3,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 4,
          "dy": 3.5
        },
        {
          "dx": 4,
          "dy": 2
        },
        {
          "dx": 6,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4,
          "dy": 2
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 6,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE 8"
        }
      ],
      "goal": "Pocket the 3-ball and finish with a playable angle on the 8-ball.",
      "instructions": "Visualize the pocket line, then the 90-degree tangent line. Deliver the cue ball sliding at impact.",
      "setupInstructions": "Use the displayed diamond-grid references."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Sliding Cue Ball",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Four. Grid-friendly coordinates preserve the lesson and make setup repeatable."
    },
    "metadata": {
      "tags": [
        "pkf",
        "sliding-cue-ball",
        "stun",
        "figures-4-5-4-8",
        "pattern"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-sliding-3ball-pattern",
    "title": "PKF · Sliding 3-Ball Pattern",
    "description": "Run 2, 3 and 4 in order using sliding cue-ball tangent lines.",
    "xp": 50,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 2,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 2,
          "dx": 3,
          "dy": 2
        },
        {
          "n": 3,
          "dx": 4,
          "dy": 3
        },
        {
          "n": 4,
          "dx": 5,
          "dy": 2
        }
      ],
      "targetBall": 2,
      "targetPocket": "TL",
      "cueBallPath": [
        {
          "dx": 2,
          "dy": 3
        },
        {
          "dx": 3,
          "dy": 2
        },
        {
          "dx": 4,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 3,
          "dy": 2
        },
        {
          "x": 0,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 4,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "NEXT SHOT"
        }
      ],
      "goal": "Run 2 → 3 → 4 while using sliding cue-ball routes for position.",
      "instructions": "Visualize each pocket line and tangent line before shooting. Reset the complete pattern after a miss.",
      "setupInstructions": "Place the balls on the displayed grid references."
    },
    "scoringRules": {
      "mode": "success",
      "attempts": 5,
      "pass": {
        "made": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Sliding Cue Ball",
    "difficulty": 2,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Four. Grid-friendly coordinates preserve the lesson and make setup repeatable."
    },
    "metadata": {
      "tags": [
        "pkf",
        "sliding-cue-ball",
        "stun",
        "figures-4-14-4-17",
        "rail-gate"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-stun-rail-gate-medium",
    "title": "PKF · Stun Rail Gate · Medium",
    "description": "Pocket the object ball with a sliding cue ball and pass through the rail-side gate.",
    "xp": 50,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 3,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 4,
          "dy": 2
        },
        {
          "n": 6,
          "dx": 5.75,
          "dy": 1.75
        },
        {
          "n": 7,
          "dx": 5.75,
          "dy": 2.25
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 3,
          "dy": 3
        },
        {
          "dx": 4,
          "dy": 2
        },
        {
          "dx": 6,
          "dy": 2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4,
          "dy": 2
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 6,
          "dy": 2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "RAIL GATE"
        }
      ],
      "goal": "Pocket the 1-ball and send the cue ball between the blockers without touching either.",
      "instructions": "If the cue ball hits the near blocker it is usually drawing; if it hits the far blocker it is usually rolling. Adjust speed until it passes cleanly.",
      "setupInstructions": "Use the shown grid references; blockers straddle the tangent-line route."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Sliding Cue Ball",
    "difficulty": 2,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Four. Grid-friendly coordinates preserve the lesson and make setup repeatable."
    },
    "metadata": {
      "tags": [
        "pkf",
        "sliding-cue-ball",
        "stun",
        "figures-4-14-4-17",
        "rail-gate"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-stun-rail-gate-soft",
    "title": "PKF · Stun Rail Gate · Soft",
    "description": "Pocket the object ball with a sliding cue ball and pass through the rail-side gate.",
    "xp": 50,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 3,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 4,
          "dy": 2
        },
        {
          "n": 6,
          "dx": 5.75,
          "dy": 1.75
        },
        {
          "n": 7,
          "dx": 5.75,
          "dy": 2.25
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 3,
          "dy": 3
        },
        {
          "dx": 4,
          "dy": 2
        },
        {
          "dx": 6,
          "dy": 2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4,
          "dy": 2
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.0,
      "targetZones": [
        {
          "dx": 6,
          "dy": 2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "RAIL GATE"
        }
      ],
      "goal": "Pocket the 1-ball and send the cue ball between the blockers without touching either.",
      "instructions": "If the cue ball hits the near blocker it is usually drawing; if it hits the far blocker it is usually rolling. Adjust speed until it passes cleanly.",
      "setupInstructions": "Use the shown grid references; blockers straddle the tangent-line route."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Sliding Cue Ball",
    "difficulty": 3,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Four. Grid-friendly coordinates preserve the lesson and make setup repeatable."
    },
    "metadata": {
      "tags": [
        "pkf",
        "sliding-cue-ball",
        "stun",
        "figures-4-14-4-17",
        "rail-gate"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-stun-rail-gate-firm",
    "title": "PKF · Stun Rail Gate · Firm",
    "description": "Pocket the object ball with a sliding cue ball and pass through the rail-side gate.",
    "xp": 50,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 3,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 4,
          "dy": 2
        },
        {
          "n": 6,
          "dx": 5.75,
          "dy": 1.75
        },
        {
          "n": 7,
          "dx": 5.75,
          "dy": 2.25
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 3,
          "dy": 3
        },
        {
          "dx": 4,
          "dy": 2
        },
        {
          "dx": 6,
          "dy": 2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4,
          "dy": 2
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 2.0,
      "targetZones": [
        {
          "dx": 6,
          "dy": 2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "RAIL GATE"
        }
      ],
      "goal": "Pocket the 1-ball and send the cue ball between the blockers without touching either.",
      "instructions": "If the cue ball hits the near blocker it is usually drawing; if it hits the far blocker it is usually rolling. Adjust speed until it passes cleanly.",
      "setupInstructions": "Use the shown grid references; blockers straddle the tangent-line route."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Sliding Cue Ball",
    "difficulty": 2,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Four. Positions use simple diamond-grid references when compatible with the original lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "sliding-cue-ball",
        "figures-4-18-4-20",
        "distance-control"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-long-slide-20",
    "title": "PKF · Long Slide · Long Soft",
    "description": "Keep the cue ball sliding at object-ball contact from progressively longer distance.",
    "xp": 55,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 2.5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 2.5,
          "dy": 3
        },
        {
          "dx": 6,
          "dy": 3
        },
        {
          "dx": 6,
          "dy": 4
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 3
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": -0.75,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 6,
          "dy": 4,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SLIDE ZONE"
        }
      ],
      "goal": "Pocket the 1-ball and keep the cue ball on the sliding route into the target zone.",
      "instructions": "Start with low spin. As distance increases, adjust speed and cue height so the cue ball is still sliding at impact.",
      "setupInstructions": "Object ball stays fixed on the grid. Move the cue ball progressively farther back along the same line."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Sliding Cue Ball",
    "difficulty": 2,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Four. Positions use simple diamond-grid references when compatible with the original lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "sliding-cue-ball",
        "figures-4-18-4-20",
        "distance-control"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-long-slide-21",
    "title": "PKF · Long Slide · Long Medium",
    "description": "Keep the cue ball sliding at object-ball contact from progressively longer distance.",
    "xp": 55,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 2,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 2,
          "dy": 3
        },
        {
          "dx": 6,
          "dy": 3
        },
        {
          "dx": 6,
          "dy": 4
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 3
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": -0.75,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 6,
          "dy": 4,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SLIDE ZONE"
        }
      ],
      "goal": "Pocket the 1-ball and keep the cue ball on the sliding route into the target zone.",
      "instructions": "Start with low spin. As distance increases, adjust speed and cue height so the cue ball is still sliding at impact.",
      "setupInstructions": "Object ball stays fixed on the grid. Move the cue ball progressively farther back along the same line."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Sliding Cue Ball",
    "difficulty": 3,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Four. Positions use simple diamond-grid references when compatible with the original lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "sliding-cue-ball",
        "figures-4-18-4-20",
        "distance-control"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-long-slide-22",
    "title": "PKF · Long Slide · Long Firm",
    "description": "Keep the cue ball sliding at object-ball contact from progressively longer distance.",
    "xp": 55,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 1.5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 1.5,
          "dy": 3
        },
        {
          "dx": 6,
          "dy": 3
        },
        {
          "dx": 6,
          "dy": 4
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 3
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": -0.75,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 2.25,
      "targetZones": [
        {
          "dx": 6,
          "dy": 4,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SLIDE ZONE"
        }
      ],
      "goal": "Pocket the 1-ball and keep the cue ball on the sliding route into the target zone.",
      "instructions": "Start with low spin. As distance increases, adjust speed and cue height so the cue ball is still sliding at impact.",
      "setupInstructions": "Object ball stays fixed on the grid. Move the cue ball progressively farther back along the same line."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Sliding Cue Ball",
    "difficulty": 3,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Four. Positions use simple diamond-grid references when compatible with the original lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "sliding-cue-ball",
        "figures-4-21-4-22",
        "rail-markers"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-two-marker-slide",
    "title": "PKF · Two-Marker Slide Path",
    "description": "Send the sliding cue ball between two rail markers and into the end-rail position zone.",
    "xp": 55,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 2,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 4,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 2,
          "dy": 3
        },
        {
          "dx": 4,
          "dy": 2
        },
        {
          "dx": 6,
          "dy": 3
        },
        {
          "dx": 7,
          "dy": 4
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4,
          "dy": 2
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 7,
          "dy": 4,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "END ZONE"
        }
      ],
      "goal": "Pocket the 1-ball, cross the first-rail marker correctly, and finish in the end-rail target zone.",
      "instructions": "Use the first rail marker as feedback. Landing above or below it shows whether the cue ball had too much roll or draw at contact.",
      "setupInstructions": "Use the displayed grid positions. Place physical stickers at the indicated rail-crossing and end-zone references if desired."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Sliding Cue Ball",
    "difficulty": 2,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Four. Positions use simple diamond-grid references when compatible with the original lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "sliding-cue-ball",
        "figures-4-23-4-27",
        "shape-comparison"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-shape-spin-follow",
    "title": "PKF · Rolling Shape",
    "description": "Play the same cut with a different cue-ball state and compare the resulting position route.",
    "xp": 55,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 3,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 3,
          "dx": 4,
          "dy": 2
        },
        {
          "n": 8,
          "dx": 6,
          "dy": 1.5
        }
      ],
      "targetBall": 3,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 3,
          "dy": 3
        },
        {
          "dx": 4,
          "dy": 2
        },
        {
          "dx": 6,
          "dy": 2.5
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4,
          "dy": 2
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 6,
          "dy": 2.5,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE 8"
        }
      ],
      "goal": "Pocket the 3-ball and land in the selected position zone for the 8-ball.",
      "instructions": "Use the same setup each time. Change only the cue-ball state so you learn how roll, slide and low spin alter the route.",
      "setupInstructions": "3-ball and 8-ball remain fixed. Reset the cue ball to the same grid reference for every attempt."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Sliding Cue Ball",
    "difficulty": 2,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Four. Positions use simple diamond-grid references when compatible with the original lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "sliding-cue-ball",
        "figures-4-23-4-27",
        "shape-comparison"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-shape-spin-stun",
    "title": "PKF · Sliding Shape",
    "description": "Play the same cut with a different cue-ball state and compare the resulting position route.",
    "xp": 55,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 3,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 3,
          "dx": 4,
          "dy": 2
        },
        {
          "n": 8,
          "dx": 6,
          "dy": 1.5
        }
      ],
      "targetBall": 3,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 3,
          "dy": 3
        },
        {
          "dx": 4,
          "dy": 2
        },
        {
          "dx": 6,
          "dy": 3.5
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4,
          "dy": 2
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 6,
          "dy": 3.5,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE 8"
        }
      ],
      "goal": "Pocket the 3-ball and land in the selected position zone for the 8-ball.",
      "instructions": "Use the same setup each time. Change only the cue-ball state so you learn how roll, slide and low spin alter the route.",
      "setupInstructions": "3-ball and 8-ball remain fixed. Reset the cue ball to the same grid reference for every attempt."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Sliding Cue Ball",
    "difficulty": 2,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Four. Positions use simple diamond-grid references when compatible with the original lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "sliding-cue-ball",
        "figures-4-23-4-27",
        "shape-comparison"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-shape-spin-stun-draw",
    "title": "PKF · Low-Spin Shape",
    "description": "Play the same cut with a different cue-ball state and compare the resulting position route.",
    "xp": 55,
    "skillEffects": {
      "Cue-Ball Control": 0.6,
      "Position Play": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 3,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 3,
          "dx": 4,
          "dy": 2
        },
        {
          "n": 8,
          "dx": 6,
          "dy": 1.5
        }
      ],
      "targetBall": 3,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 3,
          "dy": 3
        },
        {
          "dx": 4,
          "dy": 2
        },
        {
          "dx": 5.5,
          "dy": 4
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4,
          "dy": 2
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": -0.5,
        "hTips": 0
      },
      "technique": "stun-draw",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 5.5,
          "dy": 4,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE 8"
        }
      ],
      "goal": "Pocket the 3-ball and land in the selected position zone for the 8-ball.",
      "instructions": "Use the same setup each time. Change only the cue-ball state so you learn how roll, slide and low spin alter the route.",
      "setupInstructions": "3-ball and 8-ball remain fixed. Reset the cue ball to the same grid reference for every attempt."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 2,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five: Half Table Pattern Play. The original lessons emphasize center/low/center-high and keeping the cue ball on one half of the table."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-half-p1-1to2",
    "title": "PKF · Half Pattern 1 · 1 to 2",
    "description": "Use center ball to pocket the 1 and come off the side rail into the ideal angle on the 2.",
    "xp": 60,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6.5,
          "dy": 2
        },
        {
          "n": 2,
          "dx": 5,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 3,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 3
        },
        {
          "dx": 6.5,
          "dy": 2
        },
        {
          "dx": 5.75,
          "dy": 3.25
        },
        {
          "dx": 5.25,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6.5,
          "dy": 2
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 5.25,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and finish in the shape zone for the 2.",
      "instructions": "Use center ball. Let the natural angle do the work; avoid unnecessary sidespin.",
      "setupInstructions": "Set all balls from the displayed diamond grid. Keep the entire pattern on one half of the table."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 2,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five: Half Table Pattern Play. The original lessons emphasize center/low/center-high and keeping the cue ball on one half of the table."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-half-p1-2to3",
    "title": "PKF · Half Pattern 1 · 2 to 3",
    "description": "From the ideal 2-ball angle, roll naturally toward the end rail for shape on the 3.",
    "xp": 60,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 5.25,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6.5,
          "dy": 2
        },
        {
          "n": 2,
          "dx": 5,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 3,
          "dy": 2
        }
      ],
      "targetBall": 2,
      "targetPocket": "BM",
      "cueBallPath": [
        {
          "dx": 5.25,
          "dy": 3
        },
        {
          "dx": 5,
          "dy": 3
        },
        {
          "dx": 3.25,
          "dy": 3.5
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5,
          "dy": 3
        },
        {
          "x": 50,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.0,
      "targetZones": [
        {
          "dx": 3.25,
          "dy": 3.5,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 2 and roll into a simple angle on the 3.",
      "instructions": "Use a natural rolling cue ball and minimal effort.",
      "setupInstructions": "Reset the 1/2/3 layout; begin from the Pattern 1 position zone."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 2,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five: Half Table Pattern Play. The original lessons emphasize center/low/center-high and keeping the cue ball on one half of the table."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-half-p2-center",
    "title": "PKF · Half Pattern 2 · Center Route",
    "description": "Pocket the 1 with center ball and use the side rail to reach the correct angle on the 2.",
    "xp": 60,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 2
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6.5,
          "dy": 3
        },
        {
          "n": 2,
          "dx": 4.5,
          "dy": 2
        },
        {
          "n": 3,
          "dx": 3,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 2
        },
        {
          "dx": 6.5,
          "dy": 3
        },
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "dx": 4.75,
          "dy": 2.75
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6.5,
          "dy": 3
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 4.75,
          "dy": 2.75,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and land in the 2-ball shape zone.",
      "instructions": "Use center ball and control speed; the PKF lesson favors the natural center-ball route over unnecessary sidespin.",
      "setupInstructions": "Use the shown grid references and keep the pattern within one half-table."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 2,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five: Half Table Pattern Play. The original lessons emphasize center/low/center-high and keeping the cue ball on one half of the table."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-half-p3-draw",
    "title": "PKF · Half Pattern 3 · Draw to 2",
    "description": "Pocket the 1 and draw into the correct angle on the 2.",
    "xp": 60,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 2.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6.5,
          "dy": 3
        },
        {
          "n": 2,
          "dx": 5,
          "dy": 2
        },
        {
          "n": 3,
          "dx": 3,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 2.5
        },
        {
          "dx": 6.5,
          "dy": 3
        },
        {
          "dx": 5.5,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6.5,
          "dy": 3
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": -1,
        "hTips": 0
      },
      "technique": "draw",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 5.5,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and draw into the 2-ball position zone.",
      "instructions": "Use a controlled draw stroke. Avoid ending too straight or on the wrong side of the 2.",
      "setupInstructions": "Use the displayed grid references."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 2,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five: Half Table Pattern Play. The original lessons emphasize center/low/center-high and keeping the cue ball on one half of the table."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-half-p3-slide-a",
    "title": "PKF · Half Pattern 3 · Slide Route A",
    "description": "From the 2-ball position, use a sliding cue ball to head toward the corner-pocket side of the 3.",
    "xp": 60,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 5.5,
        "dy": 3.25
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6.5,
          "dy": 3
        },
        {
          "n": 2,
          "dx": 5,
          "dy": 2
        },
        {
          "n": 3,
          "dx": 3,
          "dy": 3
        }
      ],
      "targetBall": 2,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 5.5,
          "dy": 3.25
        },
        {
          "dx": 5,
          "dy": 2
        },
        {
          "dx": 3.5,
          "dy": 2.75
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5,
          "dy": 2
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 3.5,
          "dy": 2.75,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 2 and reach the Route A zone for the 3.",
      "instructions": "Use a firm sliding stroke. This is the corner-pocket route from the PKF comparison.",
      "setupInstructions": "Begin from the ideal 2-ball position zone."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 2,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five: Half Table Pattern Play. The original lessons emphasize center/low/center-high and keeping the cue ball on one half of the table."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-half-p3-slide-b",
    "title": "PKF · Half Pattern 3 · Slide Route B",
    "description": "Use the alternate sliding route from the 2 to send the cue ball toward the side-rail position for the 3.",
    "xp": 60,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 5.5,
        "dy": 3.25
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6.5,
          "dy": 3
        },
        {
          "n": 2,
          "dx": 5,
          "dy": 2
        },
        {
          "n": 3,
          "dx": 3,
          "dy": 3
        }
      ],
      "targetBall": 2,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 5.5,
          "dy": 3.25
        },
        {
          "dx": 5,
          "dy": 2
        },
        {
          "dx": 4,
          "dy": 3.5
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5,
          "dy": 2
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 4,
          "dy": 3.5,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 2 and reach the alternate shape zone for the 3.",
      "instructions": "Use a firm sliding stroke and compare this route with Route A.",
      "setupInstructions": "Begin from the same 2-ball position as Route A."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 2,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five: Half Table Pattern Play. The original lessons emphasize center/low/center-high and keeping the cue ball on one half of the table."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-half-p4-pocket-choice",
    "title": "PKF · Half Pattern 4 · Pocket Choice",
    "description": "Pocket the 1 and play position on the 2 with the next pocket choice in mind.",
    "xp": 60,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6.5,
          "dy": 2
        },
        {
          "n": 2,
          "dx": 4.5,
          "dy": 2.5
        },
        {
          "n": 3,
          "dx": 3,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 3
        },
        {
          "dx": 6.5,
          "dy": 2
        },
        {
          "dx": 5.25,
          "dy": 2.75
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6.5,
          "dy": 2
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": -0.75,
        "hTips": 0
      },
      "technique": "draw",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 5.25,
          "dy": 2.75,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and leave an angle on the 2 that preserves an easy route to the 3.",
      "instructions": "Work backward from the 3-ball pocket. The PKF lesson emphasizes choosing the 2-ball pocket before deciding the 1-ball position route.",
      "setupInstructions": "Use the displayed half-table grid layout."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 2,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five. Setups use repeatable diamond-grid references while preserving the pattern-play lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-half-p5-high",
    "title": "PKF · Half Pattern 5 · High Route",
    "description": "Pocket the 1 and use center-high to preserve the correct angle on the 2.",
    "xp": 60,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6.5,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 5,
          "dy": 2
        },
        {
          "n": 3,
          "dx": 3.5,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 3.5
        },
        {
          "dx": 6.5,
          "dy": 2.5
        },
        {
          "dx": 5.5,
          "dy": 2.75
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6.5,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 5.5,
          "dy": 2.75,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use center-high to preserve the correct angle on the 2.",
      "instructions": "Favor the natural high-ball route; do not add sidespin unless the layout forces it.",
      "setupInstructions": "Use the displayed full/half-diamond grid references; keep the pattern on one half of the table."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 2,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five. Setups use repeatable diamond-grid references while preserving the pattern-play lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-half-p6-low",
    "title": "PKF · Half Pattern 6 · Low Hold",
    "description": "Pocket the 1 and use low ball to hold the cue ball for the 2.",
    "xp": 60,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 2.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 3
        },
        {
          "n": 2,
          "dx": 4.5,
          "dy": 2
        },
        {
          "n": 3,
          "dx": 3,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 2.5
        },
        {
          "dx": 6,
          "dy": 3
        },
        {
          "dx": 5.25,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 3
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": -0.75,
        "hTips": 0
      },
      "technique": "stun-draw",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 5.25,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use low ball to hold the cue ball for the 2.",
      "instructions": "Use only enough low to control the angle. The objective is position, not maximum draw.",
      "setupInstructions": "Use the displayed full/half-diamond grid references; keep the pattern on one half of the table."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five. Setups use repeatable diamond-grid references while preserving the pattern-play lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-half-p7-two-rail",
    "title": "PKF · Half Pattern 7 · Two Rail",
    "description": "Pocket the 1 and use the natural two-rail route to reach the 2-ball position zone.",
    "xp": 60,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6.5,
          "dy": 2
        },
        {
          "n": 2,
          "dx": 4.5,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 3,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 3
        },
        {
          "dx": 6.5,
          "dy": 2
        },
        {
          "dx": 5.75,
          "dy": 3.5
        },
        {
          "dx": 4.75,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6.5,
          "dy": 2
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 4.75,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use the natural two-rail route to reach the 2-ball position zone.",
      "instructions": "Let the cue ball travel naturally. Focus on speed and entering the position zone along its long axis.",
      "setupInstructions": "Use the displayed full/half-diamond grid references; keep the pattern on one half of the table."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 2,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five. Setups use repeatable diamond-grid references while preserving the pattern-play lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-half-p8-stun",
    "title": "PKF · Half Pattern 8 · Stun Across",
    "description": "Pocket the 1 with a sliding cue ball and cross into the ideal angle for the 2.",
    "xp": 60,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 2
        },
        {
          "n": 2,
          "dx": 4,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 3,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 3
        },
        {
          "dx": 6,
          "dy": 2
        },
        {
          "dx": 4.75,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 4.75,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 with a sliding cue ball and cross into the ideal angle for the 2.",
      "instructions": "Visualize the tangent line before shooting. Use speed to choose how far along the line the cue ball travels.",
      "setupInstructions": "Use the displayed full/half-diamond grid references; keep the pattern on one half of the table."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five. Setups use repeatable diamond-grid references while preserving the pattern-play lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-half-p9-draw-rail",
    "title": "PKF · Half Pattern 9 · Draw Rail",
    "description": "Pocket the 1 and use draw plus the rail to arrive on the correct side of the 2.",
    "xp": 60,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 2.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6.5,
          "dy": 3
        },
        {
          "n": 2,
          "dx": 5,
          "dy": 2
        },
        {
          "n": 3,
          "dx": 3.5,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 2.5
        },
        {
          "dx": 6.5,
          "dy": 3
        },
        {
          "dx": 6,
          "dy": 3.75
        },
        {
          "dx": 5.25,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6.5,
          "dy": 3
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": -1,
        "hTips": 0
      },
      "technique": "draw",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 5.25,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use draw plus the rail to arrive on the correct side of the 2.",
      "instructions": "Do not overpower the draw. Judge the rail contact and speed so the cue ball enters the shape zone cleanly.",
      "setupInstructions": "Use the displayed full/half-diamond grid references; keep the pattern on one half of the table."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 2,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five. Setups use repeatable diamond-grid references while preserving the pattern-play lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-half-p10-roll",
    "title": "PKF · Half Pattern 10 · Natural Roll",
    "description": "Pocket the 1 and roll naturally into a simple 2-ball angle.",
    "xp": 60,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 4.5,
          "dy": 2
        },
        {
          "n": 3,
          "dx": 3,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 3.5
        },
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "dx": 5,
          "dy": 2.75
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.75,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.0,
      "targetZones": [
        {
          "dx": 5,
          "dy": 2.75,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and roll naturally into a simple 2-ball angle.",
      "instructions": "Use a soft rolling cue ball. The lesson is to recognize when natural roll already provides the route.",
      "setupInstructions": "Use the displayed full/half-diamond grid references; keep the pattern on one half of the table."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 2,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five. Setups use repeatable diamond-grid references while preserving the pattern-play lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-half-p11-speed",
    "title": "PKF · Half Pattern 11 · Speed Only",
    "description": "Pocket the 1 and reach the 2-ball zone using center ball and speed control only.",
    "xp": 60,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6.5,
          "dy": 2
        },
        {
          "n": 2,
          "dx": 5,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 3.5,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 3
        },
        {
          "dx": 6.5,
          "dy": 2
        },
        {
          "dx": 5.25,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6.5,
          "dy": 2
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.0,
      "targetZones": [
        {
          "dx": 5.25,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and reach the 2-ball zone using center ball and speed control only.",
      "instructions": "Avoid sidespin. Repeat until you can enter the same position zone by changing only stroke speed.",
      "setupInstructions": "Use the displayed full/half-diamond grid references; keep the pattern on one half of the table."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five, printed pages 64–70. Layout coordinates are normalized to repeatable diamond-grid references while preserving the source lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play",
        "figures-5-23-5-27",
        "two-rail"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-p64-two-rail",
    "title": "PKF · Two-Rail Position Window",
    "description": "Pocket the 1 and use two rails to enter the larger position window for the 2.",
    "xp": 65,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 4,
          "dy": 2
        },
        {
          "n": 3,
          "dx": 2.5,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3.5
        },
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "dx": 6.25,
          "dy": 4
        },
        {
          "dx": 4.75,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": -0.75,
        "hTips": 0
      },
      "technique": "stun-draw",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 4.75,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use two rails to enter the larger position window for the 2.",
      "instructions": "Favor the two-rail route because it enters the position area with a larger margin for speed error. Adjust low spin until the second-rail exit is repeatable.",
      "setupInstructions": "Use the displayed full/half-diamond references. Keep the pattern on one half of the table."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 2,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five, printed pages 64–70. Layout coordinates are normalized to repeatable diamond-grid references while preserving the source lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play",
        "figure-5-28",
        "angle-choice"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-p65-angle-a",
    "title": "PKF · Ideal Angle A · Soft Roll",
    "description": "Pocket the 2 and softly roll off the side rail into shape on the 3.",
    "xp": 65,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 4.5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 2,
          "dx": 5,
          "dy": 2.5
        },
        {
          "n": 3,
          "dx": 6.5,
          "dy": 2
        }
      ],
      "targetBall": 2,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 4.5,
          "dy": 3
        },
        {
          "dx": 5,
          "dy": 2.5
        },
        {
          "dx": 6,
          "dy": 2.75
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5,
          "dy": 2.5
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.75,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.0,
      "targetZones": [
        {
          "dx": 6,
          "dy": 2.75,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 2 and softly roll off the side rail into shape on the 3.",
      "instructions": "This is the preferred shallow angle: use a soft rolling cue ball and let the rail naturally carry it toward the 3.",
      "setupInstructions": "Use the displayed full/half-diamond references. Keep the pattern on one half of the table."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five, printed pages 64–70. Layout coordinates are normalized to repeatable diamond-grid references while preserving the source lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play",
        "figure-5-28",
        "recovery"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-p65-angle-b",
    "title": "PKF · Angle B · Sliding Recovery",
    "description": "Recover from the flatter 2-ball angle by using a firmer sliding cue ball for shape on the 3.",
    "xp": 65,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 4.75,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 2,
          "dx": 5,
          "dy": 2.5
        },
        {
          "n": 3,
          "dx": 6.5,
          "dy": 2
        }
      ],
      "targetBall": 2,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 4.75,
          "dy": 3
        },
        {
          "dx": 5,
          "dy": 2.5
        },
        {
          "dx": 6.25,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5,
          "dy": 2.5
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 6.25,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Recover from the flatter 2-ball angle by using a firmer sliding cue ball for shape on the 3.",
      "instructions": "When the angle is flatter, replace the soft roll with a firmer sliding cue ball. Keep the hit near center.",
      "setupInstructions": "Use the displayed full/half-diamond references. Keep the pattern on one half of the table."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 2,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five, printed pages 64–70. Layout coordinates are normalized to repeatable diamond-grid references while preserving the source lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play",
        "figures-5-30-5-33",
        "natural-route"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-p65-close-shape",
    "title": "PKF · Close Shape · 1 to 2",
    "description": "Pocket the 1 softly and finish close to the 2 with the correct angle for the 3.",
    "xp": 65,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 3
        },
        {
          "n": 2,
          "dx": 4.5,
          "dy": 2.5
        },
        {
          "n": 3,
          "dx": 6.5,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3.5
        },
        {
          "dx": 6,
          "dy": 3
        },
        {
          "dx": 5,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 3
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": 0.25,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.0,
      "targetZones": [
        {
          "dx": 5,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 softly and finish close to the 2 with the correct angle for the 3.",
      "instructions": "The PKF lesson prefers this natural route over forcing the cue ball to the end rail and back. Stay close to the 1 and use a soft stroke.",
      "setupInstructions": "Use the displayed full/half-diamond references. Keep the pattern on one half of the table."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five, printed pages 64–70. Layout coordinates are normalized to repeatable diamond-grid references while preserving the source lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play",
        "figures-5-34-5-40",
        "four-ball",
        "side-rail"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-p67-side-rail",
    "title": "PKF · Four-Ball · Side-Rail Entry",
    "description": "Pocket the 1 and come off the side rail toward the 2-ball position area.",
    "xp": 65,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6.5,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 4.5,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 3,
          "dy": 2
        },
        {
          "n": 4,
          "dx": 6.5,
          "dy": 3.5
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 3.5
        },
        {
          "dx": 6.5,
          "dy": 2.5
        },
        {
          "dx": 6,
          "dy": 3.75
        },
        {
          "dx": 5,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6.5,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 5,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and come off the side rail toward the 2-ball position area.",
      "instructions": "Prefer the rail-entry route because even a small speed error tends to preserve the correct angle on the 2. Avoid getting too close to the side rail.",
      "setupInstructions": "Use the displayed full/half-diamond references. Keep the pattern on one half of the table."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five, printed pages 64–70. Layout coordinates are normalized to repeatable diamond-grid references while preserving the source lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play",
        "figures-5-41-5-44",
        "four-ball",
        "backward-planning"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-p68-fourball-backward",
    "title": "PKF · Four-Ball · Work Backward",
    "description": "Pocket the 1 and land close to the 2-ball pocket line so the remaining 2→3→4 route stays natural.",
    "xp": 65,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 4.5,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 3,
          "dy": 2.5
        },
        {
          "n": 4,
          "dx": 6.5,
          "dy": 1.5
        }
      ],
      "targetBall": 1,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3
        },
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "dx": 5,
          "dy": 2.75
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": 0.25,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.0,
      "targetZones": [
        {
          "dx": 5,
          "dy": 2.75,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and land close to the 2-ball pocket line so the remaining 2→3→4 route stays natural.",
      "instructions": "Work backward from the 4-ball pocket before shooting. A hanging ball is easy to make, but poor position on it can ruin the pattern.",
      "setupInstructions": "Use the displayed full/half-diamond references. Keep the pattern on one half of the table."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five, printed pages 64–70. Layout coordinates are normalized to repeatable diamond-grid references while preserving the source lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play",
        "figures-5-46-5-53",
        "end-rail",
        "route-choice"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-p69-endrail-slide",
    "title": "PKF · End-Rail Route · Slide",
    "description": "Pocket the 1 and use the sliding side-rail route to finish near the end rail for the 2.",
    "xp": 65,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 4,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 3,
          "dy": 2.5
        },
        {
          "n": 4,
          "dx": 6.5,
          "dy": 1.5
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 6,
          "dy": 3
        },
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "dx": 6.25,
          "dy": 3.75
        },
        {
          "dx": 5,
          "dy": 4
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 5,
          "dy": 4,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use the sliding side-rail route to finish near the end rail for the 2.",
      "instructions": "This is one of the PKF's four routes to the end rail. Once there, choose rolling or sliding cue-ball behavior on the 2 based on the exact angle.",
      "setupInstructions": "Use the displayed full/half-diamond references. Keep the pattern on one half of the table."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five, printed pages 71–84. Layouts use simple grid references while preserving the source pattern lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play",
        "figures-5-54-5-58",
        "route-choice"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-half-p71-rail-first",
    "title": "PKF · Rail-First Shape Choice",
    "description": "Pocket the 1 and use the rail route that leaves the larger position window on the 2.",
    "xp": 70,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 4.5,
          "dy": 2
        },
        {
          "n": 3,
          "dx": 3,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3.5
        },
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "dx": 5.75,
          "dy": 3.75
        },
        {
          "dx": 4.75,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.25,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 4.75,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use the rail route that leaves the larger position window on the 2.",
      "instructions": "Compare the available routes before shooting. Prefer the route where a small speed error still leaves a playable 2-ball angle.",
      "setupInstructions": "Use the displayed diamond-grid references. Keep the pattern within the half-table training area."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five, printed pages 71–84. Layouts use simple grid references while preserving the source pattern lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play",
        "figures-5-59-5-63",
        "high-ball"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-half-p72-high-roll",
    "title": "PKF · High-Ball Rail Exit",
    "description": "Pocket the 1 with a rolling cue ball and use the rail exit to create the correct 2-ball angle.",
    "xp": 70,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 4,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 2.5,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 6,
          "dy": 3.5
        },
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "dx": 6.25,
          "dy": 3.25
        },
        {
          "dx": 4.75,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.75,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 4.75,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 with a rolling cue ball and use the rail exit to create the correct 2-ball angle.",
      "instructions": "Use high/rolling cue ball rather than forcing the route with sidespin. Judge the first-rail contact and speed.",
      "setupInstructions": "Use the displayed diamond-grid references. Keep the pattern within the half-table training area."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five, printed pages 71–84. Layouts use simple grid references while preserving the source pattern lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play",
        "figures-5-64-5-68",
        "position-window"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-half-p73-angle-window",
    "title": "PKF · Position Window · Angle First",
    "description": "Pocket the 1 and finish inside the broad position window while preserving the correct side of the 2.",
    "xp": 70,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 2
        },
        {
          "n": 2,
          "dx": 4.5,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 3,
          "dy": 2.5
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3
        },
        {
          "dx": 6,
          "dy": 2
        },
        {
          "dx": 5,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 5,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and finish inside the broad position window while preserving the correct side of the 2.",
      "instructions": "Do not chase a single point. The goal is the correct angle inside the usable position window.",
      "setupInstructions": "Use the displayed diamond-grid references. Keep the pattern within the half-table training area."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five, printed pages 71–84. Layouts use simple grid references while preserving the source pattern lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play",
        "five-ball",
        "figures-5-69-5-77"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-fiveball-p1-start",
    "title": "PKF · Five-Ball Pattern 1 · Start",
    "description": "Start the first five-ball pattern by pocketing the 1 and preserving an easy natural route to the 2.",
    "xp": 70,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6.25,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 5,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 4,
          "dy": 2
        },
        {
          "n": 4,
          "dx": 3,
          "dy": 3
        },
        {
          "n": 5,
          "dx": 2,
          "dy": 2.5
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 3.5
        },
        {
          "dx": 6.25,
          "dy": 2.5
        },
        {
          "dx": 5.25,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6.25,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 5.25,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Start the first five-ball pattern by pocketing the 1 and preserving an easy natural route to the 2.",
      "instructions": "Plan the complete 1→5 pattern before shooting. Use the simplest center/high/low route available and avoid unnecessary cue-ball travel.",
      "setupInstructions": "Use the displayed diamond-grid references. Keep the pattern within the half-table training area."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five, printed pages 71–84. Layouts use simple grid references while preserving the source pattern lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play",
        "five-ball",
        "figures-5-78-5-85"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-fiveball-p2-start",
    "title": "PKF · Five-Ball Pattern 2 · Start",
    "description": "Start the second five-ball pattern and land on the correct side of the 2 for the planned sequence.",
    "xp": 70,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 2
        },
        {
          "n": 2,
          "dx": 5,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 4,
          "dy": 2.5
        },
        {
          "n": 4,
          "dx": 3,
          "dy": 3
        },
        {
          "n": 5,
          "dx": 2,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3.5
        },
        {
          "dx": 6,
          "dy": 2
        },
        {
          "dx": 5.25,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 5.25,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Start the second five-ball pattern and land on the correct side of the 2 for the planned sequence.",
      "instructions": "Work backward from the 5-ball before choosing the first position route. Keep the cue ball away from the rail whenever possible.",
      "setupInstructions": "Use the displayed diamond-grid references. Keep the pattern within the half-table training area."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five, printed pages 71–84. Layouts use simple grid references while preserving the source pattern lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play",
        "five-ball",
        "figures-5-86-5-96"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-fiveball-pocket-line",
    "title": "PKF · Five-Ball · Pocket-Line Shape",
    "description": "Pocket the 1 and approach the 2-ball position from near its pocket line.",
    "xp": 70,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 4.75,
          "dy": 2
        },
        {
          "n": 3,
          "dx": 3.75,
          "dy": 3
        },
        {
          "n": 4,
          "dx": 2.75,
          "dy": 2
        },
        {
          "n": 5,
          "dx": 2,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3
        },
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "dx": 5,
          "dy": 2.75
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": -0.5,
        "hTips": 0
      },
      "technique": "stun-draw",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 5,
          "dy": 2.75,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and approach the 2-ball position from near its pocket line.",
      "instructions": "When the next position window is small, prioritize the correct line over exact distance. A little short or long is playable if the angle is right.",
      "setupInstructions": "Use the displayed diamond-grid references. Keep the pattern within the half-table training area."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Half Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Five, printed pages 71–84. Layouts use simple grid references while preserving the source pattern lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "half-table",
        "pattern-play",
        "five-ball",
        "figures-5-97-5-106"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-fiveball-slide-window",
    "title": "PKF · Five-Ball · Sliding Window",
    "description": "Pocket the 1 with a sliding cue ball and enter the narrow shape window for the 2.",
    "xp": 70,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 4.25,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 3.25,
          "dy": 2
        },
        {
          "n": 4,
          "dx": 2.5,
          "dy": 3
        },
        {
          "n": 5,
          "dx": 1.75,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 6,
          "dy": 3.5
        },
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "dx": 4.75,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 4.75,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 with a sliding cue ball and enter the narrow shape window for the 2.",
      "instructions": "Use the tangent-line route and control speed. This pattern rewards precise angle management more than extra spin.",
      "setupInstructions": "Use the displayed diamond-grid references. Keep the pattern within the half-table training area."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six: Full Table Patterns. Layouts are normalized to clear diamond-grid references while retaining the source route/position lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "chapter-6",
        "route-planning"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-p1-correct-side",
    "title": "PKF · Full Pattern 1 · Correct Side",
    "description": "Pocket the 1 and arrive on the correct side of the 2 so the 2→3 route stays simple.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6.5,
          "dy": 2
        },
        {
          "n": 2,
          "dx": 4.5,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 2.5,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 3
        },
        {
          "dx": 6.5,
          "dy": 2
        },
        {
          "dx": 5.5,
          "dy": 3.25
        },
        {
          "dx": 4.75,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6.5,
          "dy": 2
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 4.75,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and arrive on the correct side of the 2 so the 2→3 route stays simple.",
      "instructions": "Before shooting, identify which side of the 2 gives the natural route to the 3. Use the simplest rolling route rather than forcing position.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. This is a full-table pattern; preserve the shown side of each ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six: Full Table Patterns. Layouts are normalized to clear diamond-grid references while retaining the source route/position lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "chapter-6",
        "speed-control",
        "long-route"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-long-roll",
    "title": "PKF · Full Table · Long Roll",
    "description": "Pocket the 1 and use a controlled long rolling route to reach the 2-ball position window.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 3.5,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 1.5,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 3.5
        },
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "dx": 5.5,
          "dy": 3.75
        },
        {
          "dx": 3.75,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.75,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 3.75,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use a controlled long rolling route to reach the 2-ball position window.",
      "instructions": "Full-table patterns magnify speed errors. Enter the position zone along its long axis and avoid trying to stop on one exact point.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. This is a full-table pattern; preserve the shown side of each ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six: Full Table Patterns. Layouts are normalized to clear diamond-grid references while retaining the source route/position lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "chapter-6",
        "obstacle",
        "route-choice"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-traffic",
    "title": "PKF · Full Table · Avoid Traffic",
    "description": "Pocket the 1 and route the cue ball around the blocker into shape on the 2.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.75,
          "dy": 2
        },
        {
          "n": 2,
          "dx": 3.5,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 1.75,
          "dy": 2.5
        },
        {
          "n": 8,
          "dx": 4.5,
          "dy": 2.75
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3
        },
        {
          "dx": 5.75,
          "dy": 2
        },
        {
          "dx": 6.25,
          "dy": 3.75
        },
        {
          "dx": 4,
          "dy": 3.5
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.75,
          "dy": 2
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 4,
          "dy": 3.5,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and route the cue ball around the blocker into shape on the 2.",
      "instructions": "Choose the route that keeps the blocker out of play. The lesson is route safety first, then precise speed.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. This is a full-table pattern; preserve the shown side of each ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six: Full Table Patterns. Layouts are normalized to clear diamond-grid references while retaining the source route/position lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "chapter-6",
        "draw",
        "center-table"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-low-route",
    "title": "PKF · Full Table · Low Route",
    "description": "Pocket the 1 and use controlled low spin to return toward the center for the 2.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 2.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 3
        },
        {
          "n": 2,
          "dx": 4,
          "dy": 2
        },
        {
          "n": 3,
          "dx": 2,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 2.5
        },
        {
          "dx": 6,
          "dy": 3
        },
        {
          "dx": 5.25,
          "dy": 3.5
        },
        {
          "dx": 4.25,
          "dy": 2.75
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 3
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": -1,
        "hTips": 0
      },
      "technique": "draw",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 4.25,
          "dy": 2.75,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use controlled low spin to return toward the center for the 2.",
      "instructions": "Use enough low to create the route without over-drawing. On a full table, prioritize arriving on the correct side of the next ball.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. This is a full-table pattern; preserve the shown side of each ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six: Full Table Patterns. Layouts are normalized to clear diamond-grid references while retaining the source route/position lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "chapter-6",
        "two-rail",
        "running-english"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-two-rail",
    "title": "PKF · Full Table · Two-Rail Shape",
    "description": "Pocket the 1 and use the natural two-rail route to approach the 2 from the correct direction.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 3,
          "dy": 2
        },
        {
          "n": 3,
          "dx": 1.5,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3.5
        },
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "dx": 6.25,
          "dy": 3.75
        },
        {
          "dx": 4.75,
          "dy": 4
        },
        {
          "dx": 3.5,
          "dy": 2.75
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0.25
      },
      "technique": "follow",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 3.5,
          "dy": 2.75,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use the natural two-rail route to approach the 2 from the correct direction.",
      "instructions": "Let the rails widen the position window. Use only modest running English; speed control is more important than extra spin.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. This is a full-table pattern; preserve the shown side of each ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six: Full Table Patterns. Layouts are normalized to clear diamond-grid references while retaining the source route/position lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "chapter-6",
        "end-rail",
        "full-table-speed"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-endrail-entry",
    "title": "PKF · Full Table · End-Rail Entry",
    "description": "Pocket the 1 and travel through the end-rail route into a playable angle on the 2.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.5,
          "dy": 2
        },
        {
          "n": 2,
          "dx": 2.5,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 1.5,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 6,
          "dy": 3
        },
        {
          "dx": 5.5,
          "dy": 2
        },
        {
          "dx": 6.25,
          "dy": 3.5
        },
        {
          "dx": 4.5,
          "dy": 4
        },
        {
          "dx": 2.75,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.5,
          "dy": 2
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 2.0,
      "targetZones": [
        {
          "dx": 2.75,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and travel through the end-rail route into a playable angle on the 2.",
      "instructions": "Visualize the entire route before shooting. Use the end rail to approach the 2-ball zone from a forgiving direction instead of trying to stop short.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. This is a full-table pattern; preserve the shown side of each ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six: Full Table Patterns. Layouts are normalized to clear diamond-grid references while retaining the source route/position lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "chapter-6",
        "three-ball",
        "planning"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-threeball-plan",
    "title": "PKF · Full Table · 3-Ball Plan",
    "description": "Run the three-ball layout by first landing in the correct 2-ball window.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 2
        },
        {
          "n": 2,
          "dx": 3.5,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 1.5,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 3
        },
        {
          "dx": 6,
          "dy": 2
        },
        {
          "dx": 5.25,
          "dy": 3.25
        },
        {
          "dx": 3.75,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.25,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 3.75,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Run the three-ball layout by first landing in the correct 2-ball window.",
      "instructions": "Plan 1→2→3 before the first stroke. The first position route should make the second route easier, not merely leave any shot on the 2.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. This is a full-table pattern; preserve the shown side of each ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six: Full Table Patterns. Positions favor repeatable diamond-grid references without changing the route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "center-table",
        "stun"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-center-cross",
    "title": "PKF · Full Table · Center Cross",
    "description": "Pocket the 1 and cross the center of the table into the correct 2-ball angle.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 3.5,
          "dy": 2
        },
        {
          "n": 3,
          "dx": 1.5,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 3.5
        },
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "dx": 5.25,
          "dy": 3.25
        },
        {
          "dx": 3.75,
          "dy": 2.75
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 3.75,
          "dy": 2.75,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and cross the center of the table into the correct 2-ball angle.",
      "instructions": "Use a sliding/center-ball route and judge speed so the cue ball crosses into the broad side of the position window.",
      "setupInstructions": "Set the balls from the displayed full/half-diamond grid references. Preserve the shown side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six: Full Table Patterns. Positions favor repeatable diamond-grid references without changing the route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "three-rail",
        "running-english"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-three-rail",
    "title": "PKF · Full Table · Three-Rail Route",
    "description": "Pocket the 1 and use three rails to approach the 2 from the safe side.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.5,
          "dy": 2
        },
        {
          "n": 2,
          "dx": 2.5,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 1.5,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3
        },
        {
          "dx": 5.5,
          "dy": 2
        },
        {
          "dx": 6.25,
          "dy": 3.75
        },
        {
          "dx": 4.75,
          "dy": 4
        },
        {
          "dx": 3.25,
          "dy": 3.5
        },
        {
          "dx": 2.75,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.5,
          "dy": 2
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0.25
      },
      "technique": "follow",
      "speed": 2.0,
      "targetZones": [
        {
          "dx": 2.75,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use three rails to approach the 2 from the safe side.",
      "instructions": "Let the rails create the angle. Use modest running spin and prioritize the final approach direction over stopping on an exact point.",
      "setupInstructions": "Set the balls from the displayed full/half-diamond grid references. Preserve the shown side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six: Full Table Patterns. Positions favor repeatable diamond-grid references without changing the route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "angle-management"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-short-side",
    "title": "PKF · Full Table · Avoid Short Side",
    "description": "Pocket the 1 and stay on the long side of the 2-ball position window.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 2
        },
        {
          "n": 2,
          "dx": 3,
          "dy": 2.5
        },
        {
          "n": 3,
          "dx": 1.5,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 3
        },
        {
          "dx": 6,
          "dy": 2
        },
        {
          "dx": 5,
          "dy": 3.5
        },
        {
          "dx": 3.5,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 3.5,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and stay on the long side of the 2-ball position window.",
      "instructions": "Avoid crossing onto the short side of the next ball. A slightly longer shot with the correct angle is better than a close shot on the wrong side.",
      "setupInstructions": "Set the balls from the displayed full/half-diamond grid references. Preserve the shown side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six: Full Table Patterns. Positions favor repeatable diamond-grid references without changing the route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "center-table",
        "low-spin"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-center-reset",
    "title": "PKF · Full Table · Center Reset",
    "description": "Pocket the 1 and bring the cue ball back toward center table for a flexible 2-ball angle.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 2.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.75,
          "dy": 3
        },
        {
          "n": 2,
          "dx": 3.5,
          "dy": 2
        },
        {
          "n": 3,
          "dx": 1.5,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 2.5
        },
        {
          "dx": 5.75,
          "dy": 3
        },
        {
          "dx": 5,
          "dy": 3.75
        },
        {
          "dx": 4,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.75,
          "dy": 3
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": -0.5,
        "hTips": 0
      },
      "technique": "stun-draw",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 4,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and bring the cue ball back toward center table for a flexible 2-ball angle.",
      "instructions": "Center table is often a large, forgiving destination. Use controlled low spin rather than trying to draw to one tiny point.",
      "setupInstructions": "Set the balls from the displayed full/half-diamond grid references. Preserve the shown side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six: Full Table Patterns. Positions favor repeatable diamond-grid references without changing the route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "rail-route",
        "position-window"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-rail-window",
    "title": "PKF · Full Table · Rail Window",
    "description": "Pocket the 1 and use the rail to enter the 2-ball position window along its long axis.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 3,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 1.5,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 3.5
        },
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "dx": 6.5,
          "dy": 3.75
        },
        {
          "dx": 4.5,
          "dy": 3.5
        },
        {
          "dx": 3.25,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 3.25,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use the rail to enter the 2-ball position window along its long axis.",
      "instructions": "Choose a rail route when it makes the speed window larger. Focus on where the cue ball enters the zone, not just where it stops.",
      "setupInstructions": "Set the balls from the displayed full/half-diamond grid references. Preserve the shown side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six: Full Table Patterns. Positions favor repeatable diamond-grid references without changing the route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "draw",
        "center-table"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-draw-center",
    "title": "PKF · Full Table · Draw to Center",
    "description": "Pocket the 1 and draw toward center table while retaining the correct angle on the 2.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 2.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 3
        },
        {
          "n": 2,
          "dx": 3.5,
          "dy": 2
        },
        {
          "n": 3,
          "dx": 1.5,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 2.5
        },
        {
          "dx": 6,
          "dy": 3
        },
        {
          "dx": 5,
          "dy": 3.5
        },
        {
          "dx": 4,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 3
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": -1,
        "hTips": 0
      },
      "technique": "draw",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 4,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and draw toward center table while retaining the correct angle on the 2.",
      "instructions": "Do not maximize draw. Use only the amount required to reach the broad center-table zone.",
      "setupInstructions": "Set the balls from the displayed full/half-diamond grid references. Preserve the shown side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six: Full Table Patterns. Positions favor repeatable diamond-grid references without changing the route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "decision-making",
        "traffic",
        "route-choice"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-pattern-decision",
    "title": "PKF · Full Table · Route Decision",
    "description": "Choose and execute the safer full-table route around traffic while preserving the 2→3 pattern.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 2
        },
        {
          "n": 2,
          "dx": 3.5,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 1.5,
          "dy": 2.5
        },
        {
          "n": 8,
          "dx": 4.75,
          "dy": 2.75
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3.5
        },
        {
          "dx": 6,
          "dy": 2
        },
        {
          "dx": 6.5,
          "dy": 3.75
        },
        {
          "dx": 4.25,
          "dy": 3.5
        },
        {
          "dx": 3.75,
          "dy": 3.1
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0.25
      },
      "technique": "follow",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 3.75,
          "dy": 3.1,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Choose and execute the safer full-table route around traffic while preserving the 2→3 pattern.",
      "instructions": "Before shooting, compare the direct and rail routes. Select the one with less traffic and a larger landing window, then commit to that route.",
      "setupInstructions": "Set the balls from the displayed full/half-diamond grid references. Preserve the shown side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six full-table pattern examples. Positions are normalized to clear full/half-diamond references while preserving the source decision/route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "backward-planning",
        "four-ball"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-work-backward",
    "title": "PKF · Full Table · Work Backward",
    "description": "Pocket the 1 and land on the side of the 2 that makes the 2→3→4 sequence easiest.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 4.25,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 2.5,
          "dy": 2
        },
        {
          "n": 4,
          "dx": 1.5,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3.5
        },
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "dx": 5,
          "dy": 3.25
        },
        {
          "dx": 4.5,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 4.5,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and land on the side of the 2 that makes the 2→3→4 sequence easiest.",
      "instructions": "Work backward from the final ball before choosing the first route. The first position is judged by what it creates later in the pattern.",
      "setupInstructions": "Set the balls from the displayed full/half-diamond references. Preserve the intended side/angle on the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six full-table pattern examples. Positions are normalized to clear full/half-diamond references while preserving the source decision/route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "route-choice",
        "rail-route"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-rail-vs-direct",
    "title": "PKF · Full Table · Rail vs Direct",
    "description": "Use the safer rail route to reach the broad side of the 2-ball position area.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.75,
          "dy": 2
        },
        {
          "n": 2,
          "dx": 3.75,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 2,
          "dy": 2.5
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3
        },
        {
          "dx": 5.75,
          "dy": 2
        },
        {
          "dx": 6.25,
          "dy": 3.5
        },
        {
          "dx": 4.25,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.75,
          "dy": 2
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.25,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 4.25,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Use the safer rail route to reach the broad side of the 2-ball position area.",
      "instructions": "Compare the direct route with the rail route before shooting. Favor the route that gives a larger margin for speed error.",
      "setupInstructions": "Set the balls from the displayed full/half-diamond references. Preserve the intended side/angle on the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six full-table pattern examples. Positions are normalized to clear full/half-diamond references while preserving the source decision/route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "speed-control",
        "natural-roll"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-soft-angle",
    "title": "PKF · Full Table · Soft Angle",
    "description": "Pocket the 1 softly and retain a useful angle on the 2.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 4,
          "dy": 2
        },
        {
          "n": 3,
          "dx": 2.25,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 6,
          "dy": 3.5
        },
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "dx": 4.5,
          "dy": 2.75
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.0,
      "targetZones": [
        {
          "dx": 4.5,
          "dy": 2.75,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 softly and retain a useful angle on the 2.",
      "instructions": "Do not overrun the position. A softer natural roll can preserve the next angle better than sending the cue ball to another rail.",
      "setupInstructions": "Set the balls from the displayed full/half-diamond references. Preserve the intended side/angle on the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six full-table pattern examples. Positions are normalized to clear full/half-diamond references while preserving the source decision/route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "stun",
        "tangent-line"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-stun-angle",
    "title": "PKF · Full Table · Stun Angle",
    "description": "Pocket the 1 with a sliding cue ball and use the tangent-line route to create the next angle.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.25,
        "dy": 3.25
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 3.75,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 2,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 6.25,
          "dy": 3.25
        },
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "dx": 4.25,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 4.25,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 with a sliding cue ball and use the tangent-line route to create the next angle.",
      "instructions": "Visualize the tangent line first. Use speed—not extra sidespin—to choose how far the cue ball travels along it.",
      "setupInstructions": "Set the balls from the displayed full/half-diamond references. Preserve the intended side/angle on the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six full-table pattern examples. Positions are normalized to clear full/half-diamond references while preserving the source decision/route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "two-rail",
        "position-window"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-two-rail-window",
    "title": "PKF · Full Table · Two-Rail Window",
    "description": "Pocket the 1 and enter the 2-ball position window through a natural two-rail route.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 3.25,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 1.5,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3.5
        },
        {
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "dx": 6.5,
          "dy": 3.75
        },
        {
          "dx": 4.75,
          "dy": 4
        },
        {
          "dx": 3.5,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0.25
      },
      "technique": "follow",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 3.5,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and enter the 2-ball position window through a natural two-rail route.",
      "instructions": "Use modest running spin and let the rails widen the usable landing area. Judge the approach direction as carefully as the final distance.",
      "setupInstructions": "Set the balls from the displayed full/half-diamond references. Preserve the intended side/angle on the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six full-table pattern examples. Positions are normalized to clear full/half-diamond references while preserving the source decision/route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "end-rail",
        "route-choice"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-endrail-choice",
    "title": "PKF · Full Table · End-Rail Choice",
    "description": "Pocket the 1 and use the end-rail route to approach the 2 from the favorable side.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.25,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.5,
          "dy": 2
        },
        {
          "n": 2,
          "dx": 3,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 1.5,
          "dy": 2.5
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 6.25,
          "dy": 3
        },
        {
          "dx": 5.5,
          "dy": 2
        },
        {
          "dx": 6.25,
          "dy": 3.5
        },
        {
          "dx": 4.5,
          "dy": 4
        },
        {
          "dx": 3.25,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.5,
          "dy": 2
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 3.25,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use the end-rail route to approach the 2 from the favorable side.",
      "instructions": "Choose the end-rail route when it makes the final approach more forgiving. Avoid trying to stop the cue ball at one tiny point.",
      "setupInstructions": "Set the balls from the displayed full/half-diamond references. Preserve the intended side/angle on the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six full-table pattern examples. Positions are normalized to clear full/half-diamond references while preserving the source decision/route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "five-ball",
        "planning"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-fiveball-opening",
    "title": "PKF · Full Table · Five-Ball Opening",
    "description": "Begin the full-table five-ball pattern by pocketing the 1 and preserving the planned 2→3 route.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 3.5
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6.25,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 4.75,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 3.5,
          "dy": 2
        },
        {
          "n": 4,
          "dx": 2.25,
          "dy": 3
        },
        {
          "n": 5,
          "dx": 1.25,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 3.5
        },
        {
          "dx": 6.25,
          "dy": 2.5
        },
        {
          "dx": 5.25,
          "dy": 3.25
        },
        {
          "dx": 4.9,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6.25,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 4.9,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Begin the full-table five-ball pattern by pocketing the 1 and preserving the planned 2→3 route.",
      "instructions": "Plan all five balls before the first stroke. Use the first shot to establish the correct side of the 2 rather than simply leaving any makeable shot.",
      "setupInstructions": "Set the balls from the displayed full/half-diamond references. Preserve the intended side/angle on the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, source figures 6-1 through 6-34. Coordinates are normalized to repeatable grid references while preserving the described cue-ball route."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-1-6-4",
        "rail-target",
        "low-action"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-1-five-to-eight",
    "title": "PKF · 5 to 8 · Low Rail Target",
    "description": "Pocket the 5 and use low action to travel off the rail into position on the 8.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3.2
      },
      "ballPositions": [
        {
          "n": 5,
          "dx": 6,
          "dy": 2.5
        },
        {
          "n": 8,
          "dx": 2,
          "dy": 2
        }
      ],
      "targetBall": 5,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3.2
        },
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "dx": 5.2,
          "dy": 3.7
        },
        {
          "dx": 3.2,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": -0.75,
        "hTips": 0
      },
      "technique": "stun-draw",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 3.2,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 5 and use low action to travel off the rail into position on the 8.",
      "instructions": "Pick a specific rail target first. Hit the 5 with the required fullness, using a soft stroke and low cue-ball contact to reach the 8-ball position area.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the intended side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, source figures 6-1 through 6-34. Coordinates are normalized to repeatable grid references while preserving the described cue-ball route."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-5-6-10",
        "sliding",
        "rail-target"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-5-three-to-eight",
    "title": "PKF · 3 to 8 · Sliding Rail Target",
    "description": "Pocket the 3 and send a sliding cue ball to the chosen rail target for position on the 8.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 2,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 3,
          "dx": 3,
          "dy": 2.5
        },
        {
          "n": 8,
          "dx": 6.5,
          "dy": 2
        }
      ],
      "targetBall": 3,
      "targetPocket": "BL",
      "cueBallPath": [
        {
          "dx": 2,
          "dy": 3
        },
        {
          "dx": 3,
          "dy": 2.5
        },
        {
          "dx": 4.8,
          "dy": 3.7
        },
        {
          "dx": 6,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 3,
          "dy": 2.5
        },
        {
          "x": 0,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 6,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 3 and send a sliding cue ball to the chosen rail target for position on the 8.",
      "instructions": "Choose a precise rail target and repeat until you can hit it consistently. The source drill later adds blocker balls to tighten the acceptable path.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the intended side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, source figures 6-1 through 6-34. Coordinates are normalized to repeatable grid references while preserving the described cue-ball route."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-11-6-17",
        "solids",
        "angle-management"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-11-three-to-seven",
    "title": "PKF · Solids Pattern · 3 to 7",
    "description": "Pocket the 3 and use the sliding route to create the correct angle on the 7.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 5.8,
        "dy": 3.2
      },
      "ballPositions": [
        {
          "n": 3,
          "dx": 5,
          "dy": 2.5
        },
        {
          "n": 7,
          "dx": 3.5,
          "dy": 3
        },
        {
          "n": 8,
          "dx": 1.5,
          "dy": 2
        }
      ],
      "targetBall": 3,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 5.8,
          "dy": 3.2
        },
        {
          "dx": 5,
          "dy": 2.5
        },
        {
          "dx": 4.2,
          "dy": 3.4
        },
        {
          "dx": 3.8,
          "dy": 3.1
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 3.8,
          "dy": 3.1,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 3 and use the sliding route to create the correct angle on the 7.",
      "instructions": "Favor the sliding path when it gives a repeatable route. Avoid landing straight on the 7; preserve the angle needed to move naturally toward the 8.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the intended side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, source figures 6-1 through 6-34. Coordinates are normalized to repeatable grid references while preserving the described cue-ball route."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-14-6-17",
        "rolling-vs-sliding"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-14-seven-to-eight",
    "title": "PKF · Solids Pattern · 7 to 8",
    "description": "Pocket the 7 and roll naturally toward the correct side of the 8.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 3.8,
        "dy": 3.1
      },
      "ballPositions": [
        {
          "n": 7,
          "dx": 3.5,
          "dy": 3
        },
        {
          "n": 8,
          "dx": 1.5,
          "dy": 2
        }
      ],
      "targetBall": 7,
      "targetPocket": "BM",
      "cueBallPath": [
        {
          "dx": 3.8,
          "dy": 3.1
        },
        {
          "dx": 3.5,
          "dy": 3
        },
        {
          "dx": 2.4,
          "dy": 2.5
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 3.5,
          "dy": 3
        },
        {
          "x": 50,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.0,
      "targetZones": [
        {
          "dx": 2.4,
          "dy": 2.5,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 7 and roll naturally toward the correct side of the 8.",
      "instructions": "Use a rolling cue ball when the 7-ball angle allows it. If the angle becomes flatter, switch to the sliding alternative rather than forcing the roll.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the intended side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, source figures 6-1 through 6-34. Coordinates are normalized to repeatable grid references while preserving the described cue-ball route."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-18-6-22",
        "high-action",
        "danger-area"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-18-five-to-two",
    "title": "PKF · 5 to 2 · High Rail Route",
    "description": "Pocket the 5 with high action, contact the side rail, and finish just below the 2-ball pocket line.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.2,
        "dy": 3.2
      },
      "ballPositions": [
        {
          "n": 5,
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 3.5,
          "dy": 2
        },
        {
          "n": 8,
          "dx": 1.5,
          "dy": 3
        }
      ],
      "targetBall": 5,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 6.2,
          "dy": 3.2
        },
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "dx": 5.1,
          "dy": 3.8
        },
        {
          "dx": 3.8,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": 0.75,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 3.8,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 5 with high action, contact the side rail, and finish just below the 2-ball pocket line.",
      "instructions": "The source emphasizes arriving just below the 2-ball pocket line. Avoid crossing the 5-ball path or getting too close to the rail.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the intended side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, source figures 6-1 through 6-34. Coordinates are normalized to repeatable grid references while preserving the described cue-ball route."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-23-6-26",
        "two-rail",
        "stun-follow"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-23-five-to-eight",
    "title": "PKF · 5 to 8 · Two-Rail Shape",
    "description": "Pocket the 5 and use two rails to create the preferred angle on the 8.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 5.8,
        "dy": 3.1
      },
      "ballPositions": [
        {
          "n": 5,
          "dx": 5,
          "dy": 2.5
        },
        {
          "n": 8,
          "dx": 2,
          "dy": 3
        }
      ],
      "targetBall": 5,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 5.8,
          "dy": 3.1
        },
        {
          "dx": 5,
          "dy": 2.5
        },
        {
          "dx": 5.6,
          "dy": 3.8
        },
        {
          "dx": 3.7,
          "dy": 4
        },
        {
          "dx": 2.5,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": 0.75,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 2.5,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 5 and use two rails to create the preferred angle on the 8.",
      "instructions": "First identify the rail target. If the 5-ball angle is too full for natural roll, use a firm stun-follow route to create the needed two-rail path.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the intended side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, source figures 6-1 through 6-34. Coordinates are normalized to repeatable grid references while preserving the described cue-ball route."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-27-6-34",
        "blocked-pocket",
        "draw",
        "backward-planning"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-27-one-to-three",
    "title": "PKF · Blocked 8 Pattern · 1 to 3",
    "description": "Pocket the 1 and draw to the side rail to create the correct angle on the 3.",
    "xp": 75,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 5.5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 4.8,
          "dy": 2.5
        },
        {
          "n": 3,
          "dx": 3.2,
          "dy": 3
        },
        {
          "n": 8,
          "dx": 1.2,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 5.5,
          "dy": 3
        },
        {
          "dx": 4.8,
          "dy": 2.5
        },
        {
          "dx": 4,
          "dy": 3.4
        },
        {
          "dx": 3.5,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4.8,
          "dy": 2.5
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": -0.75,
        "hTips": 0
      },
      "technique": "draw",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 3.5,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and draw to the side rail to create the correct angle on the 3.",
      "instructions": "Because the 8 is blocked from the lower-left corner, plan the pattern around its available top-left pocket. Use low action to reach the side rail and preserve the 3-ball angle.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the intended side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, figures 6-35 onward. Positions favor repeatable full/half-diamond references while preserving the source route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-35-6-39",
        "rail-target"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-35-one-to-two",
    "title": "PKF · 1 to 2 · High Rail Target",
    "description": "Pocket the 1 and use high action off the side rail to reach the 2-ball position area.",
    "xp": 80,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3.25
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 3.75,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 2,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3.25
        },
        {
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "dx": 6.25,
          "dy": 3.75
        },
        {
          "dx": 4.25,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.75,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 4.25,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use high action off the side rail to reach the 2-ball position area.",
      "instructions": "Pick a specific side-rail target and repeat until the cue ball consistently enters the correct 2-ball window.",
      "setupInstructions": "Use the displayed full/half-diamond references. Preserve the shown side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, figures 6-35 onward. Positions favor repeatable full/half-diamond references while preserving the source route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figure-6-39",
        "slide-vs-low"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-39-two-to-three",
    "title": "PKF · 2 to 3 · Slide or Low",
    "description": "Pocket the 2 and use the appropriate sliding or low-spin rail route for position on the 3.",
    "xp": 80,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 4.25,
        "dy": 3.2
      },
      "ballPositions": [
        {
          "n": 2,
          "dx": 3.75,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 2,
          "dy": 2
        }
      ],
      "targetBall": 2,
      "targetPocket": "BL",
      "cueBallPath": [
        {
          "dx": 4.25,
          "dy": 3.2
        },
        {
          "dx": 3.75,
          "dy": 3
        },
        {
          "dx": 3,
          "dy": 3.75
        },
        {
          "dx": 2.4,
          "dy": 2.75
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 3.75,
          "dy": 3
        },
        {
          "x": 0,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": -0.5,
        "hTips": 0
      },
      "technique": "stun-draw",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 2.4,
          "dy": 2.75,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 2 and use the appropriate sliding or low-spin rail route for position on the 3.",
      "instructions": "If the cue ball is sliding, use the natural rail path. If the angle changes, use controlled low spin to draw toward the side rail and end rail.",
      "setupInstructions": "Use the displayed full/half-diamond references. Preserve the shown side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, figures 6-35 onward. Positions favor repeatable full/half-diamond references while preserving the source route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-40-6-47",
        "four-ball",
        "pocket-lines"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-40-fourball-opening",
    "title": "PKF · Four-Ball Pattern · 1 to 2",
    "description": "Pocket the 1 and finish below the 2-ball line so the 2→3 route remains natural.",
    "xp": 80,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 4,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 2.75,
          "dy": 2
        },
        {
          "n": 4,
          "dx": 1.5,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3
        },
        {
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "dx": 5,
          "dy": 3.5
        },
        {
          "dx": 4.25,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 4.25,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and finish below the 2-ball line so the 2→3 route remains natural.",
      "instructions": "Visualize the pocket lines before shooting. Avoid ending above the 2-ball line, which makes the next position route much harder.",
      "setupInstructions": "Use the displayed full/half-diamond references. Preserve the shown side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, figures 6-35 onward. Positions favor repeatable full/half-diamond references while preserving the source route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-48-6-50",
        "roll-vs-stun-follow"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-48-three-to-four",
    "title": "PKF · Four-Ball Pattern · 3 to 4",
    "description": "Pocket the 3 and use a soft rolling route to finish on the preferred side of the 4.",
    "xp": 80,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 3.25,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 3,
          "dx": 2.75,
          "dy": 2.25
        },
        {
          "n": 4,
          "dx": 1.5,
          "dy": 3
        }
      ],
      "targetBall": 3,
      "targetPocket": "TL",
      "cueBallPath": [
        {
          "dx": 3.25,
          "dy": 3
        },
        {
          "dx": 2.75,
          "dy": 2.25
        },
        {
          "dx": 2.25,
          "dy": 3.25
        },
        {
          "dx": 1.75,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 2.75,
          "dy": 2.25
        },
        {
          "x": 0,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.0,
      "targetZones": [
        {
          "dx": 1.75,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 3 and use a soft rolling route to finish on the preferred side of the 4.",
      "instructions": "When the angle allows, roll naturally. If the cue ball is above the needed line, switch to a sliding/stun-follow route rather than forcing the roll.",
      "setupInstructions": "Use the displayed full/half-diamond references. Preserve the shown side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, figures 6-35 onward. Positions favor repeatable full/half-diamond references while preserving the source route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-51-6-54",
        "five-ball",
        "route-choice"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-51-fiveball-four-to-five",
    "title": "PKF · Five-Ball Pattern · 4 to 5",
    "description": "Pocket the 4 and use the route that leaves the easiest position on the 5.",
    "xp": 80,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 3.5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 4,
          "dx": 3,
          "dy": 2.5
        },
        {
          "n": 5,
          "dx": 1.5,
          "dy": 3
        }
      ],
      "targetBall": 4,
      "targetPocket": "TL",
      "cueBallPath": [
        {
          "dx": 3.5,
          "dy": 3
        },
        {
          "dx": 3,
          "dy": 2.5
        },
        {
          "dx": 2.75,
          "dy": 3.75
        },
        {
          "dx": 1.8,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 3,
          "dy": 2.5
        },
        {
          "x": 0,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 1.8,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 4 and use the route that leaves the easiest position on the 5.",
      "instructions": "Compare the two-rail option with the side-rail option. Prefer the route whose final cue-ball path is easier to predict and control.",
      "setupInstructions": "Use the displayed full/half-diamond references. Preserve the shown side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, figures 6-35 onward. Positions favor repeatable full/half-diamond references while preserving the source route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-55-6-58",
        "five-ball",
        "high-action"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-55-one-to-two",
    "title": "PKF · Five-Ball Pattern · 1 to 2",
    "description": "Pocket the 1 and use high action off the side rail to land on or near the 2-ball line.",
    "xp": 80,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 4,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 3,
          "dy": 2
        },
        {
          "n": 4,
          "dx": 2,
          "dy": 3
        },
        {
          "n": 5,
          "dx": 1.25,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3
        },
        {
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "dx": 6.25,
          "dy": 3.5
        },
        {
          "dx": 4.4,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.75,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 4.4,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use high action off the side rail to land on or near the 2-ball line.",
      "instructions": "The source favors the high-action rail route because the cue ball can approach the 2-ball position line naturally and remain playable if slightly short.",
      "setupInstructions": "Use the displayed full/half-diamond references. Preserve the shown side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, figures 6-35 onward. Positions favor repeatable full/half-diamond references while preserving the source route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-64-6-75",
        "six-ball",
        "low-spin"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-64-sixball-four-to-five",
    "title": "PKF · Six-Ball Pattern · 4 to 5",
    "description": "Pocket the 4 and use low spin toward the side rail to create the larger 5-ball position window.",
    "xp": 80,
    "skillEffects": {
      "Pattern Play": 0.65,
      "Cue-Ball Control": 0.3
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 3.75,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 4,
          "dx": 3.25,
          "dy": 2.5
        },
        {
          "n": 5,
          "dx": 1.5,
          "dy": 3
        },
        {
          "n": 6,
          "dx": 1,
          "dy": 2
        }
      ],
      "targetBall": 4,
      "targetPocket": "TL",
      "cueBallPath": [
        {
          "dx": 3.75,
          "dy": 3
        },
        {
          "dx": 3.25,
          "dy": 2.5
        },
        {
          "dx": 2.8,
          "dy": 3.75
        },
        {
          "dx": 1.8,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 3.25,
          "dy": 2.5
        },
        {
          "x": 0,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": -0.5,
        "hTips": 0
      },
      "technique": "stun-draw",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 1.8,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 4 and use low spin toward the side rail to create the larger 5-ball position window.",
      "instructions": "The key shot in this six-ball pattern is 4→5. Use a little low spin toward the side rail; the larger window leaves an easier route to the 6.",
      "setupInstructions": "Use the displayed full/half-diamond references. Preserve the shown side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, figures 6-80 through 6-115. Coordinates use practical grid references while preserving the source route/spin lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-80-6-93",
        "seven-ball",
        "key-shot"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-80-sevenball-three-to-four",
    "title": "PKF · Seven-Ball Pattern · 3 to 4",
    "description": "Pocket the 3 and enter the small 4-ball position area without getting hooked or crossing the wrong side.",
    "xp": 80,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 5.75,
        "dy": 3.25
      },
      "ballPositions": [
        {
          "n": 3,
          "dx": 5,
          "dy": 2.5
        },
        {
          "n": 4,
          "dx": 3.75,
          "dy": 3
        },
        {
          "n": 5,
          "dx": 2.5,
          "dy": 2
        },
        {
          "n": 6,
          "dx": 1.75,
          "dy": 3
        },
        {
          "n": 7,
          "dx": 1,
          "dy": 2
        }
      ],
      "targetBall": 3,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 5.75,
          "dy": 3.25
        },
        {
          "dx": 5,
          "dy": 2.5
        },
        {
          "dx": 4.5,
          "dy": 3.6
        },
        {
          "dx": 4,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 4,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 3 and enter the small 4-ball position area without getting hooked or crossing the wrong side.",
      "instructions": "The source identifies 3→4 as the key shot. Favor a rolling route and control the first-rail contact so the cue ball enters the usable window.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the shown side of the next ball and rail approach."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, figures 6-80 through 6-115. Coordinates use practical grid references while preserving the source route/spin lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-89-6-93",
        "seven-ball",
        "rolling-path"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-89-five-to-six",
    "title": "PKF · Seven-Ball Pattern · 5 to 6",
    "description": "Pocket the 5 and use the natural rolling path to reach the 6-ball position line.",
    "xp": 80,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 3.5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 5,
          "dx": 3,
          "dy": 2.5
        },
        {
          "n": 6,
          "dx": 1.75,
          "dy": 3
        },
        {
          "n": 7,
          "dx": 1,
          "dy": 2
        }
      ],
      "targetBall": 5,
      "targetPocket": "TL",
      "cueBallPath": [
        {
          "dx": 3.5,
          "dy": 3
        },
        {
          "dx": 3,
          "dy": 2.5
        },
        {
          "dx": 2.5,
          "dy": 3.75
        },
        {
          "dx": 1.9,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 3,
          "dy": 2.5
        },
        {
          "x": 0,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 1.9,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 5 and use the natural rolling path to reach the 6-ball position line.",
      "instructions": "Track where the rolling cue ball will meet the position line. A good approach angle is more important than stopping at one exact point.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the shown side of the next ball and rail approach."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table with Sidespin",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, figures 6-80 through 6-115. Coordinates use practical grid references while preserving the source route/spin lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-94-6-98",
        "sidespin",
        "natural-route"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-94-avoid-sidespin",
    "title": "PKF · Sidespin · Natural Route First",
    "description": "Pocket the 1 and reach the 8-ball area using the natural low-spin route without unnecessary sidespin.",
    "xp": 80,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3.25
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "n": 8,
          "dx": 2,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3.25
        },
        {
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "dx": 5,
          "dy": 3.5
        },
        {
          "dx": 2.75,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": -0.5,
        "hTips": 0
      },
      "technique": "stun-draw",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 2.75,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and reach the 8-ball area using the natural low-spin route without unnecessary sidespin.",
      "instructions": "The PKF uses this example to show that sidespin is not always needed. First solve the route with center-axis spin before adding left or right.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the shown side of the next ball and rail approach."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table with Sidespin",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, figures 6-80 through 6-115. Coordinates use practical grid references while preserving the source route/spin lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figure-6-101",
        "left-spin",
        "comparison"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-101-low-left-vs-draw",
    "title": "PKF · Sidespin · Low-Left Comparison",
    "description": "Pocket the 1 and compare low-left with a no-sidespin low route to the same 5-ball position area.",
    "xp": 80,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.25,
        "dy": 3.25
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "n": 5,
          "dx": 2.5,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 6.25,
          "dy": 3.25
        },
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "dx": 6,
          "dy": 3.75
        },
        {
          "dx": 3,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": -0.75,
        "hTips": -0.5
      },
      "technique": "draw",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 3,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and compare low-left with a no-sidespin low route to the same 5-ball position area.",
      "instructions": "Practice both versions. The source stresses learning which shots truly require sidespin and which can be solved more simply without it.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the shown side of the next ball and rail approach."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table with Sidespin",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, figures 6-80 through 6-115. Coordinates use practical grid references while preserving the source route/spin lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-103-6-105",
        "running-english",
        "left-spin"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-103-running-left",
    "title": "PKF · Running English · Left",
    "description": "Pocket the 3 and use running left spin to widen the rail path toward the 5-ball position area.",
    "xp": 80,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6,
        "dy": 3.25
      },
      "ballPositions": [
        {
          "n": 3,
          "dx": 5.25,
          "dy": 2.5
        },
        {
          "n": 5,
          "dx": 2.25,
          "dy": 3
        }
      ],
      "targetBall": 3,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 6,
          "dy": 3.25
        },
        {
          "dx": 5.25,
          "dy": 2.5
        },
        {
          "dx": 6,
          "dy": 3.75
        },
        {
          "dx": 4.25,
          "dy": 4
        },
        {
          "dx": 2.75,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.25,
          "dy": 2.5
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.25,
        "hTips": -0.5
      },
      "technique": "follow",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 2.75,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 3 and use running left spin to widen the rail path toward the 5-ball position area.",
      "instructions": "Determine the cue ball's natural first-rail direction first. Because it wants to travel left after contact, left spin is running English here.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the shown side of the next ball and rail approach."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table with Sidespin",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, figures 6-80 through 6-115. Coordinates use practical grid references while preserving the source route/spin lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figure-6-106",
        "running-english",
        "rail-path"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-106-running-left-opposite",
    "title": "PKF · Running English · Opposite Side",
    "description": "Pocket the 1 and use running English to widen the multi-rail route toward the 4-ball position area.",
    "xp": 80,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 2,
        "dy": 3.25
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 2.75,
          "dy": 2.5
        },
        {
          "n": 4,
          "dx": 5.75,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "TM",
      "cueBallPath": [
        {
          "dx": 2,
          "dy": 3.25
        },
        {
          "dx": 2.75,
          "dy": 2.5
        },
        {
          "dx": 2,
          "dy": 3.75
        },
        {
          "dx": 3.75,
          "dy": 4
        },
        {
          "dx": 5.25,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 2.75,
          "dy": 2.5
        },
        {
          "x": 50,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.25,
        "hTips": -0.5
      },
      "technique": "follow",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 5.25,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use running English to widen the multi-rail route toward the 4-ball position area.",
      "instructions": "Choose spin from the cue ball's natural direction after the first rail, not simply from which side of the table the shot begins.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the shown side of the next ball and rail approach."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table with Sidespin",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, figures 6-80 through 6-115. Coordinates use practical grid references while preserving the source route/spin lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-108-6-110",
        "running-english",
        "right-spin"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-109-running-right",
    "title": "PKF · Running English · Right",
    "description": "Pocket the 13 and use running right spin so the cue ball opens its angle after the first rail for position on the 8.",
    "xp": 80,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 2.25,
        "dy": 3.25
      },
      "ballPositions": [
        {
          "n": 13,
          "dx": 3,
          "dy": 2.5
        },
        {
          "n": 8,
          "dx": 6.25,
          "dy": 3
        }
      ],
      "targetBall": 13,
      "targetPocket": "TL",
      "cueBallPath": [
        {
          "dx": 2.25,
          "dy": 3.25
        },
        {
          "dx": 3,
          "dy": 2.5
        },
        {
          "dx": 2,
          "dy": 3.75
        },
        {
          "dx": 4,
          "dy": 4
        },
        {
          "dx": 5.75,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 3,
          "dy": 2.5
        },
        {
          "x": 0,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.25,
        "hTips": 0.5
      },
      "technique": "follow",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 5.75,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 13 and use running right spin so the cue ball opens its angle after the first rail for position on the 8.",
      "instructions": "Compare this with no sidespin: running English changes the rail exit and helps the cue ball travel farther toward the 8-ball position area.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the shown side of the next ball and rail approach."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table with Sidespin",
    "difficulty": 3,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six pages 114–123. Coordinates favor practical diamond-grid references while preserving the source spin/route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "sidespin",
        "figures-6-117-6-118",
        "throw"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-117-throw",
    "title": "PKF · Throw · Left Spin Cut",
    "description": "Use left spin to throw the 8 toward the corner while the cue ball moves toward the side rail.",
    "xp": 85,
    "skillEffects": {
      "Cue-Ball Control": 0.55,
      "Pattern Play": 0.4
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 8,
          "dx": 5.25,
          "dy": 2.5
        },
        {
          "n": 5,
          "dx": 5,
          "dy": 2.45
        }
      ],
      "targetBall": 8,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 6,
          "dy": 3
        },
        {
          "dx": 5.25,
          "dy": 2.5
        },
        {
          "dx": 4.4,
          "dy": 3.4
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.25,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": -0.5
      },
      "technique": "stun",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 4.4,
          "dy": 3.4,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Use left spin to throw the 8 toward the corner while the cue ball moves toward the side rail.",
      "instructions": "Use only a small amount of left spin. The lesson is object-ball throw plus cue-ball position, not maximum sidespin.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the source rail approach and next-ball side."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table with Sidespin",
    "difficulty": 3,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six pages 114–123. Coordinates favor practical diamond-grid references while preserving the source spin/route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "sidespin",
        "figure-6-119",
        "throw",
        "speed-control"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-119-kill",
    "title": "PKF · Throw · Kill the Cue Ball",
    "description": "Pocket the 5 while using throw and fuller contact to kill cue-ball speed for the 8.",
    "xp": 85,
    "skillEffects": {
      "Cue-Ball Control": 0.55,
      "Pattern Play": 0.4
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.25,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 5,
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "n": 8,
          "dx": 2,
          "dy": 2
        }
      ],
      "targetBall": 5,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 6.25,
          "dy": 3
        },
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "dx": 4.8,
          "dy": 3.1
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0.5
      },
      "technique": "stun",
      "speed": 1.0,
      "targetZones": [
        {
          "dx": 4.8,
          "dy": 3.1,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 5 while using throw and fuller contact to kill cue-ball speed for the 8.",
      "instructions": "Aim slightly fuller and use right spin so the 5 is thrown toward the pocket while the cue ball loses energy after contact.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the source rail approach and next-ball side."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table with Sidespin",
    "difficulty": 3,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six pages 114–123. Coordinates favor practical diamond-grid references while preserving the source spin/route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "sidespin",
        "figure-6-120",
        "throw",
        "hold"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-120-hold",
    "title": "PKF · Throw · Hold for the 8",
    "description": "Pocket the 3 and hold the cue ball for the 8 by using left spin to throw the object ball.",
    "xp": 85,
    "skillEffects": {
      "Cue-Ball Control": 0.55,
      "Pattern Play": 0.4
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 5.75,
        "dy": 3.25
      },
      "ballPositions": [
        {
          "n": 3,
          "dx": 5,
          "dy": 2.5
        },
        {
          "n": 8,
          "dx": 3,
          "dy": 2
        }
      ],
      "targetBall": 3,
      "targetPocket": "BL",
      "cueBallPath": [
        {
          "dx": 5.75,
          "dy": 3.25
        },
        {
          "dx": 5,
          "dy": 2.5
        },
        {
          "dx": 4.25,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5,
          "dy": 2.5
        },
        {
          "x": 0,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": -0.5
      },
      "technique": "stun",
      "speed": 1.0,
      "targetZones": [
        {
          "dx": 4.25,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 3 and hold the cue ball for the 8 by using left spin to throw the object ball.",
      "instructions": "Aim fuller than the natural cut and use a tip of left spin. Keep the stroke controlled so the cue ball stays in the position window.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the source rail approach and next-ball side."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table with Sidespin",
    "difficulty": 3,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six pages 114–123. Coordinates favor practical diamond-grid references while preserving the source spin/route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "sidespin",
        "figures-6-129-6-130",
        "running-english",
        "two-rail"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-129-two-rail",
    "title": "PKF · High Right · Two-Rail Position",
    "description": "Pocket the 8 and use high-right running English to travel two rails toward the 9.",
    "xp": 85,
    "skillEffects": {
      "Cue-Ball Control": 0.55,
      "Pattern Play": 0.4
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 3,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 8,
          "dx": 3.75,
          "dy": 2.5
        },
        {
          "n": 9,
          "dx": 6.25,
          "dy": 2
        }
      ],
      "targetBall": 8,
      "targetPocket": "TL",
      "cueBallPath": [
        {
          "dx": 3,
          "dy": 3
        },
        {
          "dx": 3.75,
          "dy": 2.5
        },
        {
          "dx": 2.5,
          "dy": 3.75
        },
        {
          "dx": 4.5,
          "dy": 4
        },
        {
          "dx": 5.75,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 3.75,
          "dy": 2.5
        },
        {
          "x": 0,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.75,
        "hTips": 0.5
      },
      "technique": "follow",
      "speed": 2.0,
      "targetZones": [
        {
          "dx": 5.75,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 8 and use high-right running English to travel two rails toward the 9.",
      "instructions": "Use a full, accelerating stroke rather than overpowering the shot. The goal is to hit the rail target and approach the 9 from a predictable direction.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the source rail approach and next-ball side."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table with Sidespin",
    "difficulty": 3,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six pages 114–123. Coordinates favor practical diamond-grid references while preserving the source spin/route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "sidespin",
        "figure-6-131",
        "high-left",
        "rail-target"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-131-high-left",
    "title": "PKF · High Left · Rail Target",
    "description": "Pocket the 1 and use high-left spin to send the cue ball off the side rail toward the target zone.",
    "xp": 85,
    "skillEffects": {
      "Cue-Ball Control": 0.55,
      "Pattern Play": 0.4
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.25,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "n": 8,
          "dx": 2,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 6.25,
          "dy": 3
        },
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "dx": 5,
          "dy": 3.75
        },
        {
          "dx": 3,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.75,
        "hTips": -0.5
      },
      "technique": "follow",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 3,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use high-left spin to send the cue ball off the side rail toward the target zone.",
      "instructions": "Strike high enough to drive toward the side rail. If the cue ball dies after contact, raise the hit rather than simply adding more speed.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the source rail approach and next-ball side."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table with Sidespin",
    "difficulty": 3,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six pages 114–123. Coordinates favor practical diamond-grid references while preserving the source spin/route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "sidespin",
        "figures-6-135-6-138",
        "pre-shot-routine",
        "backward-planning"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-pre-shot",
    "title": "PKF · Full Table · Pre-Shot Route Plan",
    "description": "Plan the 3→4→5 sequence before shooting and land on the correct side of the 4.",
    "xp": 85,
    "skillEffects": {
      "Cue-Ball Control": 0.55,
      "Pattern Play": 0.4
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3.25
      },
      "ballPositions": [
        {
          "n": 3,
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "n": 4,
          "dx": 4,
          "dy": 3
        },
        {
          "n": 5,
          "dx": 2.25,
          "dy": 2
        }
      ],
      "targetBall": 3,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3.25
        },
        {
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "dx": 5,
          "dy": 3.25
        },
        {
          "dx": 4.25,
          "dy": 3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.25,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 4.25,
          "dy": 3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Plan the 3→4→5 sequence before shooting and land on the correct side of the 4.",
      "instructions": "Before getting down: choose the 5-ball position area, determine the 4-ball angle needed to reach it, then choose the 3-ball route that creates that angle.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the source rail approach and next-ball side."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table with Sidespin",
    "difficulty": 3,
    "skill": "Cue-Ball Control",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six pages 114–123. Coordinates favor practical diamond-grid references while preserving the source spin/route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "sidespin",
        "figures-6-139-6-149",
        "full-table-pattern",
        "pro-example"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-full-pro-pattern",
    "title": "PKF · Full Table · Pro Pattern Opening",
    "description": "Pocket the 1 and use the rail route to land on the correct side of the 2 for the full-table runout.",
    "xp": 85,
    "skillEffects": {
      "Cue-Ball Control": 0.55,
      "Pattern Play": 0.4
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 3.25
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6.25,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 4.75,
          "dy": 3
        },
        {
          "n": 4,
          "dx": 3.25,
          "dy": 3
        },
        {
          "n": 5,
          "dx": 2.25,
          "dy": 2.5
        },
        {
          "n": 6,
          "dx": 1.5,
          "dy": 2
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 3.25
        },
        {
          "dx": 6.25,
          "dy": 2.5
        },
        {
          "dx": 6.5,
          "dy": 3.75
        },
        {
          "dx": 5,
          "dy": 3.25
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6.25,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.75,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 5,
          "dy": 3.25,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use the rail route to land on the correct side of the 2 for the full-table runout.",
      "instructions": "Study the entire pattern first. The source example identifies 1→2 as the key opening shot; use the rail route to approach the 2-ball pocket line with margin for speed error.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the source rail approach and next-ball side."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, printed pages 124–133, figures 6-150 through 6-195. Setups favor repeatable diamond-grid references while preserving the source route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-150-6-151"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-150-seven-to-eight",
    "title": "PKF · 7 to 8 · Center High",
    "description": "Pocket the 7 and use center-high to reach the ideal 8-ball position area.",
    "xp": 85,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 4,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 7,
          "dx": 3.5,
          "dy": 2.5
        },
        {
          "n": 8,
          "dx": 1.5,
          "dy": 2
        }
      ],
      "targetBall": 7,
      "targetPocket": "TL",
      "cueBallPath": [
        {
          "dx": 4,
          "dy": 3
        },
        {
          "dx": 3.5,
          "dy": 2.5
        },
        {
          "dx": 2.2,
          "dy": 2.75
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 3.5,
          "dy": 2.5
        },
        {
          "x": 0,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.0,
      "targetZones": [
        {
          "dx": 2.2,
          "dy": 2.75,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 7 and use center-high to reach the ideal 8-ball position area.",
      "instructions": "Use the simple rolling route when available. If the cue ball is too high on the 7-ball line, use controlled draw to recover the same 8-ball pocket.",
      "setupInstructions": "Use the displayed full/half-diamond grid references and preserve the intended pocket line/side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, printed pages 124–133, figures 6-150 through 6-195. Setups favor repeatable diamond-grid references while preserving the source route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-153-6-156",
        "nine-ball",
        "backward-planning"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-153-three-to-five",
    "title": "PKF · 9-Ball · 3 to 5 Position",
    "description": "Pocket the 3 and use the end-rail route to create the planned angle on the 5.",
    "xp": 85,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 3,
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "n": 5,
          "dx": 3.5,
          "dy": 3
        },
        {
          "n": 6,
          "dx": 2.5,
          "dy": 2
        }
      ],
      "targetBall": 3,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 6,
          "dy": 3
        },
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "dx": 5,
          "dy": 3.75
        },
        {
          "dx": 3.9,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": 0.75,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 3.9,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 3 and use the end-rail route to create the planned angle on the 5.",
      "instructions": "Work backward from the 5-ball pocket. Use the rail route that leaves the cue ball near the 3-ball line with a predictable rolling path.",
      "setupInstructions": "Use the displayed full/half-diamond grid references and preserve the intended pocket line/side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, printed pages 124–133, figures 6-150 through 6-195. Setups favor repeatable diamond-grid references while preserving the source route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-157-6-158",
        "nine-ball",
        "position-window"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-157-seven-to-eight",
    "title": "PKF · 9-Ball · 7 to 8 Window",
    "description": "Pocket the 7 and enter the highlighted 8-ball position window with a slight angle for the 9.",
    "xp": 85,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 3.5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 7,
          "dx": 3,
          "dy": 2.5
        },
        {
          "n": 8,
          "dx": 1.5,
          "dy": 3
        },
        {
          "n": 9,
          "dx": 1,
          "dy": 2
        }
      ],
      "targetBall": 7,
      "targetPocket": "TL",
      "cueBallPath": [
        {
          "dx": 3.5,
          "dy": 3
        },
        {
          "dx": 3,
          "dy": 2.5
        },
        {
          "dx": 2.4,
          "dy": 3.75
        },
        {
          "dx": 1.8,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 3,
          "dy": 2.5
        },
        {
          "x": 0,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 1.8,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 7 and enter the highlighted 8-ball position window with a slight angle for the 9.",
      "instructions": "Avoid coming up short of the position area. The ideal 8-ball angle lets the cue ball come naturally off the side rail toward the 9.",
      "setupInstructions": "Use the displayed full/half-diamond grid references and preserve the intended pocket line/side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, printed pages 124–133, figures 6-150 through 6-195. Setups favor repeatable diamond-grid references while preserving the source route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-159-6-163",
        "eight-ball",
        "breakout",
        "insurance-ball"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-160-five-breakout",
    "title": "PKF · 8-Ball · 5-Ball Breakout",
    "description": "Pocket the 5 while contacting the 7/3 cluster to open the problem balls.",
    "xp": 85,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 5,
          "dx": 5.25,
          "dy": 2.5
        },
        {
          "n": 7,
          "dx": 4,
          "dy": 2.75
        },
        {
          "n": 3,
          "dx": 3.8,
          "dy": 2.9
        },
        {
          "n": 8,
          "dx": 1.5,
          "dy": 2
        }
      ],
      "targetBall": 5,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 6,
          "dy": 3
        },
        {
          "dx": 5.25,
          "dy": 2.5
        },
        {
          "dx": 4.4,
          "dy": 2.8
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.25,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": 0.25,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 4.4,
          "dy": 2.8,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 5 while contacting the 7/3 cluster to open the problem balls.",
      "instructions": "The source identifies the 3 as the main problem. Use the 5-ball route to break the cluster early while retaining an insurance ball when possible.",
      "setupInstructions": "Use the displayed full/half-diamond grid references and preserve the intended pocket line/side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, printed pages 124–133, figures 6-150 through 6-195. Setups favor repeatable diamond-grid references while preserving the source route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-164-6-168",
        "eight-ball",
        "route-choice"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-164-three-rail",
    "title": "PKF · 8-Ball · 3-Ball Rail Route",
    "description": "Pocket the 3 and use the rail route to preserve the next 1→2→7 sequence.",
    "xp": 85,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 4.5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 3,
          "dx": 4,
          "dy": 2.5
        },
        {
          "n": 1,
          "dx": 2.75,
          "dy": 3
        },
        {
          "n": 7,
          "dx": 1.75,
          "dy": 2
        }
      ],
      "targetBall": 3,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 4.5,
          "dy": 3
        },
        {
          "dx": 4,
          "dy": 2.5
        },
        {
          "dx": 4.8,
          "dy": 3.75
        },
        {
          "dx": 3,
          "dy": 4
        },
        {
          "dx": 2.2,
          "dy": 3.1
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0.25
      },
      "technique": "follow",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 2.2,
          "dy": 3.1,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 3 and use the rail route to preserve the next 1→2→7 sequence.",
      "instructions": "Choose the route that enters the next position window from the safe side. Use running spin only as needed to widen the final rail angle.",
      "setupInstructions": "Use the displayed full/half-diamond grid references and preserve the intended pocket line/side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, printed pages 124–133, figures 6-150 through 6-195. Setups favor repeatable diamond-grid references while preserving the source route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-177-6-181",
        "eight-ball",
        "pocket-line"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-178-one-to-two",
    "title": "PKF · Solids · 1 to 2 Pocket Line",
    "description": "Pocket the 1 and finish just short of the 2-ball pocket line.",
    "xp": 85,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.25,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 3.75,
          "dy": 3
        },
        {
          "n": 4,
          "dx": 2.5,
          "dy": 2
        },
        {
          "n": 7,
          "dx": 1.5,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "BR",
      "cueBallPath": [
        {
          "dx": 6.25,
          "dy": 3
        },
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "dx": 5,
          "dy": 3.75
        },
        {
          "dx": 4,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.5,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 50
        }
      ],
      "cueContact": {
        "vTips": 0.75,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.5,
      "targetZones": [
        {
          "dx": 4,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and finish just short of the 2-ball pocket line.",
      "instructions": "Use high action to force the cue ball toward the 2-ball line. Slightly short is preferred because it preserves the planned route to the 4.",
      "setupInstructions": "Use the displayed full/half-diamond grid references and preserve the intended pocket line/side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from Chapter Six, printed pages 124–133, figures 6-150 through 6-195. Setups favor repeatable diamond-grid references while preserving the source route lesson."
    },
    "metadata": {
      "tags": [
        "pkf",
        "full-table",
        "pattern-play",
        "figures-6-189-6-195",
        "nine-ball",
        "two-rail",
        "position-window"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-193-one-to-three",
    "title": "PKF · 9-Ball · Two-Rail 1 to 3",
    "description": "Pocket the 1 and use two rails to enter the larger 3-ball position area.",
    "xp": 85,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 6.5,
        "dy": 3.25
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "n": 3,
          "dx": 3.5,
          "dy": 3
        },
        {
          "n": 4,
          "dx": 2.5,
          "dy": 2
        },
        {
          "n": 5,
          "dx": 1.5,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 6.5,
          "dy": 3.25
        },
        {
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "dx": 6.25,
          "dy": 3.75
        },
        {
          "dx": 4.75,
          "dy": 4
        },
        {
          "dx": 3.8,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5.75,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 3.8,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "SHAPE ZONE"
        }
      ],
      "goal": "Pocket the 1 and use two rails to enter the larger 3-ball position area.",
      "instructions": "The two-rail route provides a larger position window than trying to stop off one rail. Favor the forgiving route and control the final approach angle.",
      "setupInstructions": "Use the displayed full/half-diamond grid references and preserve the intended pocket line/side of the next ball."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from printed pages 134–140, figures 6-196 through 7-17. Uses repeatable grid references while preserving source position/safety concepts."
    },
    "metadata": {
      "tags": [
        "pkf",
        "figures-6-196-6-200",
        "position-window"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-196-six-window",
    "title": "PKF · 6-Ball · Position Window",
    "description": "Pocket the 6 and finish in the middle of its usable position window for the 7.",
    "xp": 85,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 4,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 6,
          "dx": 3.5,
          "dy": 2.5
        },
        {
          "n": 7,
          "dx": 2,
          "dy": 3
        }
      ],
      "targetBall": 6,
      "targetPocket": "TL",
      "cueBallPath": [
        {
          "dx": 4,
          "dy": 3
        },
        {
          "dx": 3.5,
          "dy": 2.5
        },
        {
          "dx": 2.7,
          "dy": 3.3
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 3.5,
          "dy": 2.5
        },
        {
          "x": 0,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.5,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.0,
      "targetZones": [
        {
          "dx": 2.7,
          "dy": 3.3,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "TARGET ZONE"
        }
      ],
      "goal": "Pocket the 6 and finish in the middle of its usable position window for the 7.",
      "instructions": "Play toward the middle of the position area rather than an exact point. This leaves margin for speed error while preserving the 7-ball angle.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the intended rail target and position line."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from printed pages 134–140, figures 6-196 through 7-17. Uses repeatable grid references while preserving source position/safety concepts."
    },
    "metadata": {
      "tags": [
        "pkf",
        "figures-6-201-6-202",
        "two-rail",
        "route-choice"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-201-seven-to-eight",
    "title": "PKF · 7 to 8 · Two-Rail Choice",
    "description": "Pocket the 7 and use the two-rail route to reach the 8-ball area.",
    "xp": 85,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 3.5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 7,
          "dx": 3,
          "dy": 2.5
        },
        {
          "n": 8,
          "dx": 1.5,
          "dy": 2
        }
      ],
      "targetBall": 7,
      "targetPocket": "TL",
      "cueBallPath": [
        {
          "dx": 3.5,
          "dy": 3
        },
        {
          "dx": 3,
          "dy": 2.5
        },
        {
          "dx": 2.5,
          "dy": 3.75
        },
        {
          "dx": 1.8,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 3,
          "dy": 2.5
        },
        {
          "x": 0,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": -0.5,
        "hTips": -0.25
      },
      "technique": "stun-draw",
      "speed": 1.75,
      "targetZones": [
        {
          "dx": 1.8,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "TARGET ZONE"
        }
      ],
      "goal": "Pocket the 7 and use the two-rail route to reach the 8-ball area.",
      "instructions": "Compare low-left with a firmer draw route. Choose the route whose rail entry gives the largest usable 8-ball position window.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the intended rail target and position line."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Full Table Patterns",
    "difficulty": 3,
    "skill": "Pattern Play",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from printed pages 134–140, figures 6-196 through 7-17. Uses repeatable grid references while preserving source position/safety concepts."
    },
    "metadata": {
      "tags": [
        "pkf",
        "figures-6-203-6-209",
        "random-pattern",
        "planning"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-6-203-random-pattern",
    "title": "PKF · Random Balls · Plan the Run",
    "description": "Run the balls in order while choosing each next position marker before shooting.",
    "xp": 85,
    "skillEffects": {
      "Pattern Play": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 7,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 6,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 5,
          "dy": 3
        },
        {
          "n": 3,
          "dx": 4,
          "dy": 2
        },
        {
          "n": 4,
          "dx": 3,
          "dy": 3
        },
        {
          "n": 5,
          "dx": 2,
          "dy": 2.5
        },
        {
          "n": 6,
          "dx": 1.5,
          "dy": 3
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 7,
          "dy": 3
        },
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "dx": 5.25,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 6,
          "dy": 2.5
        },
        {
          "x": 100,
          "y": 0
        }
      ],
      "cueContact": {
        "vTips": 0.25,
        "hTips": 0
      },
      "technique": "follow",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 5.25,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "TARGET ZONE"
        }
      ],
      "goal": "Run the balls in order while choosing each next position marker before shooting.",
      "instructions": "Throw several balls onto the table. Before each shot, identify the next-ball pocket line and choose a specific position area. Think at least three balls ahead.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the intended rail target and position line."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Tips & Tricks · Safeties",
    "difficulty": 3,
    "skill": "Safeties",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from printed pages 134–140, figures 6-196 through 7-17. Uses repeatable grid references while preserving source position/safety concepts."
    },
    "metadata": {
      "tags": [
        "pkf",
        "figures-7-1-7-3",
        "safety",
        "tangent-line"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-7-1-slide-safety",
    "title": "PKF · Safety · Sliding 90° Rail Target",
    "description": "Send the sliding cue ball to the chosen rail target and hide behind the 2/5 blockers.",
    "xp": 85,
    "skillEffects": {
      "Safeties": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 5.5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5,
          "dy": 2.5
        },
        {
          "n": 2,
          "dx": 2,
          "dy": 3
        },
        {
          "n": 5,
          "dx": 2.25,
          "dy": 2.75
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 5.5,
          "dy": 3
        },
        {
          "dx": 5,
          "dy": 2.5
        },
        {
          "dx": 4,
          "dy": 3.5
        },
        {
          "dx": 2.5,
          "dy": 3.4
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5,
          "dy": 2.5
        },
        {
          "dx": 5.2,
          "dy": 2.4
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 2.5,
          "dy": 3.4,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "TARGET ZONE"
        }
      ],
      "goal": "Send the sliding cue ball to the chosen rail target and hide behind the 2/5 blockers. The pocket field is nominal only; this is a safety drill, not a pocketing objective.",
      "instructions": "Visualize the 90-degree tangent line from the object ball, extend it to the rail, and use that rail point as your target.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the intended rail target and position line."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Tips & Tricks · Safeties",
    "difficulty": 3,
    "skill": "Safeties",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from printed pages 134–140, figures 6-196 through 7-17. Uses repeatable grid references while preserving source position/safety concepts."
    },
    "metadata": {
      "tags": [
        "pkf",
        "figures-7-4-7-6",
        "safety",
        "hide"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-7-4-slide-hide",
    "title": "PKF · Safety · Hide Behind Two Balls",
    "description": "Use a sliding cue ball to hide behind the blocker pair.",
    "xp": 85,
    "skillEffects": {
      "Safeties": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 5.75,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 1,
          "dx": 5,
          "dy": 2.5
        },
        {
          "n": 8,
          "dx": 2,
          "dy": 2.5
        },
        {
          "n": 9,
          "dx": 2.25,
          "dy": 2.75
        }
      ],
      "targetBall": 1,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 5.75,
          "dy": 3
        },
        {
          "dx": 5,
          "dy": 2.5
        },
        {
          "dx": 4,
          "dy": 3.5
        },
        {
          "dx": 2.5,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 5,
          "dy": 2.5
        },
        {
          "dx": 5.2,
          "dy": 2.4
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 2.5,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "TARGET ZONE"
        }
      ],
      "goal": "Use a sliding cue ball to hide behind the blocker pair. The pocket field is nominal only; this is a safety drill, not a pocketing objective.",
      "instructions": "Pick the end-rail target first, then use the 90-degree tangent line to locate the corresponding side-rail target. Control speed so the cue ball finishes behind the blockers.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the intended rail target and position line."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Tips & Tricks · Safeties",
    "difficulty": 3,
    "skill": "Safeties",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from printed pages 134–140, figures 6-196 through 7-17. Uses repeatable grid references while preserving source position/safety concepts."
    },
    "metadata": {
      "tags": [
        "pkf",
        "figures-7-7-7-9",
        "safety",
        "four-ball"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-7-7-four-safety",
    "title": "PKF · Safety · 4-Ball Hide",
    "description": "Send the cue ball behind the 7 and 8 after contacting the 4.",
    "xp": 85,
    "skillEffects": {
      "Safeties": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 5,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 4,
          "dx": 4.5,
          "dy": 2.5
        },
        {
          "n": 7,
          "dx": 2,
          "dy": 2.5
        },
        {
          "n": 8,
          "dx": 2.25,
          "dy": 2.75
        }
      ],
      "targetBall": 4,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 5,
          "dy": 3
        },
        {
          "dx": 4.5,
          "dy": 2.5
        },
        {
          "dx": 3.5,
          "dy": 3.5
        },
        {
          "dx": 2.5,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4.5,
          "dy": 2.5
        },
        {
          "dx": 4.7,
          "dy": 2.4
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 2.5,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "TARGET ZONE"
        }
      ],
      "goal": "Send the cue ball behind the 7 and 8 after contacting the 4. The pocket field is nominal only; this is a safety drill, not a pocketing objective.",
      "instructions": "Choose the end-rail hiding point, draw the 90-degree line through the 4, then use the matching side-rail target for the sliding cue ball.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the intended rail target and position line."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  },
  {
    "format": "pooliq",
    "schemaVersion": "1.0",
    "contentType": "drill",
    "contentVersion": "1.0",
    "category": "PKF · Tips & Tricks · Safeties",
    "difficulty": 3,
    "skill": "Safeties",
    "attribution": {
      "sourceName": "P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)",
      "notes": "Converted from printed pages 134–140, figures 6-196 through 7-17. Uses repeatable grid references while preserving source position/safety concepts."
    },
    "metadata": {
      "tags": [
        "pkf",
        "figures-7-13-7-15",
        "safety",
        "blockers"
      ],
      "created": "2026-09-29",
      "language": "en",
      "demo": false,
      "generator": "ChatGPT"
    },
    "careerEligible": true,
    "id": "pkf-7-13-three-safety",
    "title": "PKF · Safety · 3-Ball Behind Blockers",
    "description": "Contact the 3 and send the sliding cue ball behind the blocker balls.",
    "xp": 85,
    "skillEffects": {
      "Safeties": 0.6,
      "Cue-Ball Control": 0.35
    },
    "shot": {
      "kind": "position",
      "cueBallPosition": {
        "dx": 4.75,
        "dy": 3
      },
      "ballPositions": [
        {
          "n": 3,
          "dx": 4.25,
          "dy": 2.5
        },
        {
          "n": 8,
          "dx": 2,
          "dy": 2.5
        },
        {
          "n": 5,
          "dx": 2.25,
          "dy": 2.75
        }
      ],
      "targetBall": 3,
      "targetPocket": "TR",
      "cueBallPath": [
        {
          "dx": 4.75,
          "dy": 3
        },
        {
          "dx": 4.25,
          "dy": 2.5
        },
        {
          "dx": 3.25,
          "dy": 3.5
        },
        {
          "dx": 2.4,
          "dy": 3.2
        }
      ],
      "contactIndex": 1,
      "objectBallPath": [
        {
          "dx": 4.25,
          "dy": 2.5
        },
        {
          "dx": 4.45,
          "dy": 2.4
        }
      ],
      "cueContact": {
        "vTips": 0,
        "hTips": 0
      },
      "technique": "stun",
      "speed": 1.25,
      "targetZones": [
        {
          "dx": 2.4,
          "dy": 3.2,
          "rings": [
            {
              "r": 2.5,
              "stars": 3
            },
            {
              "r": 4,
              "stars": 2
            },
            {
              "r": 6,
              "stars": 1
            }
          ],
          "label": "TARGET ZONE"
        }
      ],
      "goal": "Contact the 3 and send the sliding cue ball behind the blocker balls. The pocket field is nominal only; this is a safety drill, not a pocketing objective.",
      "instructions": "Use the same rail-target method: pick the hiding point first, find the 90-degree tangent line, then shoot the sliding cue ball toward the corresponding side-rail target.",
      "setupInstructions": "Use the displayed full/half-diamond grid references. Preserve the intended rail target and position line."
    },
    "scoringRules": {
      "mode": "zone",
      "attempts": 5,
      "pass": {
        "stars": 7,
        "pockets": 3
      }
    }
  }
];
