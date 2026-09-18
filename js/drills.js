/**
 * Pool IQ original curriculum — geometrically accurate drills.
 * Coordinate system: viewBox 0–100 × 0–50 (2:1). Ball R ≈ 2.8.
 * ORIGINAL Pool IQ content only — no proprietary third-party drills.
 */
import { renderTableDiagram } from './tableDiagram.js';
import { extraDrills } from './drillsExtra.js';

function D(partial) {
  return {
    attempts: 10,
    passNeed: 7,
    scoringType: 'binary',
    prerequisites: [],
    xp: 100,
    skillEffects: {},
    outcomes: null,
    ...partial
  };
}

/** Helper: path from cue through OB toward pocket */
function aimPath(cue, ob, pocket) {
  return { points: [cue, ob, pocket], dashed: true };
}

export const CATEGORIES = [
  'Shot Making',
  'Stop Shots',
  'Follow',
  'Draw',
  'Stun',
  'Speed Control',
  'Cue-Ball Position',
  'Cut Shots',
  'Rail Position',
  'Pattern Play',
  'Banks',
  'Kicks',
  'Safeties',
  'Runouts'
];

const baseDrills = [
  D({
    "attempts": 10,
    "passNeed": 8,
    "scoringType": "binary",
    "prerequisites": [],
    "xp": 80,
    "skillEffects": {
      "Shot Making": 6
    },
    "outcomes": null,
    "id": "sm-straight-1",
    "name": "Center Spot Straight",
    "category": "Shot Making",
    "difficulty": 1,
    "purpose": "Build a repeatable center-ball pocketing stroke on a true straight line.",
    "setup": "Object ball on the center spot. Cue ball on the line toward BL so the shot is dead straight into TR.",
    "instructions": "Pocket the 1 in the top-right corner. Reset the exact layout after every shot. Count only clean pocketed balls — no rail first.",
    "tip": "Center tip • medium speed • quiet eyes on the object ball last",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 21.1,
          "y": 38.7
        },
        {
          "id": 1,
          "x": 50,
          "y": 25
        }
      ],
      "targetPocket": "TR",
      "paths": [
        {
          "points": [
            {
              "x": 21.1,
              "y": 38.7
            },
            {
              "x": 50,
              "y": 25
            },
            {
              "x": 97.5,
              "y": 2.5
            }
          ],
          "dashed": true
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 7,
    "scoringType": "binary",
    "prerequisites": [
      "sm-straight-1"
    ],
    "xp": 100,
    "skillEffects": {
      "Shot Making": 5
    },
    "outcomes": null,
    "id": "sm-straight-2",
    "name": "Long Diagonal Straight",
    "category": "Shot Making",
    "difficulty": 3,
    "purpose": "Pocket long straights without steering the cue.",
    "setup": "Object ball near the foot-rail side of center; cue near the head string on the same line into BR.",
    "instructions": "Pocket the 2 in the bottom-right corner on a true straight line. Smooth follow-through; do not peek up early.",
    "tip": "Center tip • soft-medium • stay down through contact",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 38.2,
          "y": 22.4
        },
        {
          "id": 2,
          "x": 75,
          "y": 38
        }
      ],
      "targetPocket": "BR",
      "paths": [
        {
          "points": [
            {
              "x": 38.2,
              "y": 22.4
            },
            {
              "x": 75,
              "y": 38
            },
            {
              "x": 97.5,
              "y": 47.5
            }
          ],
          "dashed": true
        }
      ]
    }
  }),
  D({
    "attempts": 12,
    "passNeed": 11,
    "scoringType": "binary",
    "prerequisites": [],
    "xp": 70,
    "skillEffects": {
      "Shot Making": 4
    },
    "outcomes": null,
    "id": "sm-hanging-1",
    "name": "Hanging Corner Finish",
    "category": "Shot Making",
    "difficulty": 1,
    "purpose": "Eliminate easy misses when the ball is already near a pocket.",
    "setup": "Object ball about one ball-width off the top-right jaw. Cue ball mid-table.",
    "instructions": "Pocket the hanging 3 into TR. Treat each attempt like a money ball — no rushed strokes.",
    "tip": "Center tip • soft • commit to the line",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 45,
          "y": 30
        },
        {
          "id": 3,
          "x": 91,
          "y": 7
        }
      ],
      "targetPocket": "TR",
      "paths": [
        {
          "points": [
            {
              "x": 45,
              "y": 30
            },
            {
              "x": 91,
              "y": 7
            },
            {
              "x": 97.5,
              "y": 2.5
            }
          ],
          "dashed": true
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 6,
    "scoringType": "binary",
    "prerequisites": [
      "sm-straight-1",
      "cut-1"
    ],
    "xp": 130,
    "skillEffects": {
      "Shot Making": 7
    },
    "outcomes": null,
    "id": "sm-thin-cut-intro",
    "name": "Thin Cut Introduction",
    "category": "Shot Making",
    "difficulty": 5,
    "purpose": "Learn how little contact is needed on a thin cut.",
    "setup": "Object ball between head string and top rail; cue farther right so the cut into TL is thin.",
    "instructions": "Cut the 4 into TL using a thin contact. Watch the ghost-ball target — do not overcut.",
    "tip": "Firm enough to hold the line • trust the thin aim",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "THIN"
      },
      "balls": [
        {
          "id": "cue",
          "x": 40.7,
          "y": 34.7
        },
        {
          "id": 4,
          "x": 35,
          "y": 20
        }
      ],
      "targetPocket": "TL",
      "paths": [
        {
          "points": [
            {
              "x": 40.7,
              "y": 34.7
            },
            {
              "x": 35,
              "y": 20
            },
            {
              "x": 2.5,
              "y": 2.5
            }
          ],
          "dashed": true
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 8,
    "scoringType": "binary",
    "prerequisites": [
      "sm-straight-1"
    ],
    "xp": 90,
    "skillEffects": {
      "Shot Making": 5
    },
    "outcomes": null,
    "id": "sm-side-1",
    "name": "Center Side Pocket",
    "category": "Shot Making",
    "difficulty": 2,
    "purpose": "Build confidence pocketing into the side.",
    "setup": "Object ball on the vertical center line above mid-table; cue farther down the center line into TM.",
    "instructions": "Pocket the 5 straight into the top side pocket. Keep speed soft so the ball does not rattle.",
    "tip": "Center tip • soft • aim deep into the pocket",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 50.0,
          "y": 34.0
        },
        {
          "id": 5,
          "x": 50,
          "y": 12
        }
      ],
      "targetPocket": "TM",
      "paths": [
        {
          "points": [
            {
              "x": 50.0,
              "y": 34.0
            },
            {
              "x": 50,
              "y": 12
            },
            {
              "x": 50.0,
              "y": 1.8
            }
          ],
          "dashed": true
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 7,
    "scoringType": "binary",
    "prerequisites": [
      "sm-straight-1"
    ],
    "xp": 100,
    "skillEffects": {
      "Shot Making": 5
    },
    "outcomes": null,
    "id": "sm-mid-cut",
    "name": "Mid-Table Three-Quarter",
    "category": "Shot Making",
    "difficulty": 3,
    "purpose": "Pocket a mild cut with a fullish contact.",
    "setup": "Object ball in the upper-right quadrant; cue left of the line so the cut into TR is about three-quarter ball.",
    "instructions": "Pocket the 6 into TR with a gentle cut. Prefer center tip until the line is solid.",
    "tip": "Three-quarter contact • medium • follow through straight",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "¾ BALL"
      },
      "balls": [
        {
          "id": "cue",
          "x": 58.8,
          "y": 42.0
        },
        {
          "id": 6,
          "x": 78,
          "y": 18
        }
      ],
      "targetPocket": "TR",
      "paths": [
        {
          "points": [
            {
              "x": 58.8,
              "y": 42.0
            },
            {
              "x": 78,
              "y": 18
            },
            {
              "x": 97.5,
              "y": 2.5
            }
          ],
          "dashed": true
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 6,
    "scoringType": "binary",
    "prerequisites": [
      "sm-straight-2"
    ],
    "xp": 120,
    "skillEffects": {
      "Shot Making": 6
    },
    "outcomes": null,
    "id": "sm-long-rail",
    "name": "Rail-Side Long Straight",
    "category": "Shot Making",
    "difficulty": 4,
    "purpose": "Hold a long straight line when the object ball sits near a long rail.",
    "setup": "Object ball one diamond in from the right rail at mid-height; cue near head string on the straight line into BR.",
    "instructions": "Pocket the 7 into BR. Stay perfectly still through the stroke — long shots punish body movement.",
    "tip": "Slow backswing • accelerate through • chin down",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 41.5,
          "y": 20.4
        },
        {
          "id": 7,
          "x": 82,
          "y": 40
        }
      ],
      "targetPocket": "BR",
      "paths": [
        {
          "points": [
            {
              "x": 41.5,
              "y": 20.4
            },
            {
              "x": 82,
              "y": 40
            },
            {
              "x": 97.5,
              "y": 47.5
            }
          ],
          "dashed": true
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 7,
    "scoringType": "binary",
    "prerequisites": [
      "sm-mid-cut"
    ],
    "xp": 120,
    "skillEffects": {
      "Shot Making": 6
    },
    "outcomes": null,
    "id": "sm-half-corner",
    "name": "Half-Ball Corner Pocket",
    "category": "Shot Making",
    "difficulty": 4,
    "purpose": "Make a classic half-ball cut into a corner under no spin.",
    "setup": "Object ball lower-left quadrant; cue placed for a true half-ball into BL.",
    "instructions": "Cut the 9 into BL at half-ball thickness. Use the ghost overlay as your aim check.",
    "tip": "Half-ball edge aim • firm medium • no english yet",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "HALF-BALL"
      },
      "balls": [
        {
          "id": "cue",
          "x": 70.8,
          "y": 38.4
        },
        {
          "id": 9,
          "x": 40,
          "y": 35
        }
      ],
      "targetPocket": "BL",
      "paths": [
        {
          "points": [
            {
              "x": 70.8,
              "y": 38.4
            },
            {
              "x": 40,
              "y": 35
            },
            {
              "x": 2.5,
              "y": 47.5
            }
          ],
          "dashed": true
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 7,
    "scoringType": "position",
    "prerequisites": [
      "sm-straight-1"
    ],
    "xp": 110,
    "skillEffects": {
      "Cue-Ball Control": 7
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "stop-1",
    "name": "Stop Shot Foundation",
    "category": "Stop Shots",
    "difficulty": 2,
    "purpose": "Learn center-ball stun so the cue ball dies near the object-ball spot.",
    "setup": "Straight-in to TR. Target CB zone centered on the object-ball starting spot.",
    "instructions": "Pocket the 2 into TR and leave the cue ball inside the zone (near where the 2 started). Use firm center or slight below for a true stop.",
    "tip": "Firm stroke • tip at or just below center • no follow-through scoop",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 29.6,
          "y": 33.7
        },
        {
          "id": 2,
          "x": 55,
          "y": 22
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 55,
        "y": 22,
        "r": 6
      },
      "paths": [
        {
          "points": [
            {
              "x": 29.6,
              "y": 33.7
            },
            {
              "x": 55,
              "y": 22
            },
            {
              "x": 97.5,
              "y": 2.5
            }
          ],
          "dashed": true
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 6,
    "scoringType": "position",
    "prerequisites": [
      "stop-1"
    ],
    "xp": 130,
    "skillEffects": {
      "Cue-Ball Control": 7
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "stop-2",
    "name": "Longer Stop Control",
    "category": "Stop Shots",
    "difficulty": 4,
    "purpose": "Hold a stop on a longer straight where slide distance grows.",
    "setup": "Longer straight into TR; CB zone on the OB start point.",
    "instructions": "Pocket the 3 into TR and park the cue ball in the zone. Add a touch more firmness than Stop Shot Foundation.",
    "tip": "Hit firmer, not lower — excess draw overshoots the stop",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 27.4,
          "y": 35.2
        },
        {
          "id": 3,
          "x": 60,
          "y": 20
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 60,
        "y": 20,
        "r": 6.5
      }
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "position",
    "prerequisites": [
      "stop-2"
    ],
    "xp": 150,
    "skillEffects": {
      "Cue-Ball Control": 8
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "stop-3",
    "name": "Distance Stop Window",
    "category": "Stop Shots",
    "difficulty": 6,
    "purpose": "Stop the cue ball after a long approach distance.",
    "setup": "Long approach straight into TR; zone around OB start.",
    "instructions": "Pocket the 5 into TR with a true stop. If the CB rolls forward, you followed; if it backs up, you drew — adjust tip height and firmness.",
    "tip": "Match tip height to distance — longer needs firmer, not always lower",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 31.8,
          "y": 32.4
        },
        {
          "id": 5,
          "x": 70,
          "y": 15
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 70,
        "y": 15,
        "r": 7
      }
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 7,
    "scoringType": "position",
    "prerequisites": [
      "stop-1",
      "sm-side-1"
    ],
    "xp": 115,
    "skillEffects": {
      "Cue-Ball Control": 6
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "stop-side",
    "name": "Side-Pocket Stop",
    "category": "Stop Shots",
    "difficulty": 3,
    "purpose": "Apply stop technique into a side pocket.",
    "setup": "Straight into TM; zone on OB start.",
    "instructions": "Pocket the 1 into TM and leave the cue ball in the zone.",
    "tip": "Same stop feel as corners — do not change tip height for the pocket type",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 50.0,
          "y": 38.0
        },
        {
          "id": 1,
          "x": 50,
          "y": 14
        }
      ],
      "targetPocket": "TM",
      "zone": {
        "x": 50,
        "y": 14,
        "r": 6
      }
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "position",
    "prerequisites": [
      "stop-2"
    ],
    "xp": 140,
    "skillEffects": {
      "Cue-Ball Control": 7
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "stop-cut",
    "name": "Soft-Cut Stop Hold",
    "category": "Stop Shots",
    "difficulty": 5,
    "purpose": "Keep CB near the contact area on a mild cut.",
    "setup": "Mild cut into BL; CB zone just past the OB along the tangent.",
    "instructions": "Pocket the 6 into BL with near-stun. Success if CB finishes in the zone near the collision point.",
    "tip": "Center-ish tip • firm enough to kill forward roll",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "¾ BALL"
      },
      "balls": [
        {
          "id": "cue",
          "x": 71.2,
          "y": 10.0
        },
        {
          "id": 6,
          "x": 48,
          "y": 28
        }
      ],
      "targetPocket": "BL",
      "zone": {
        "x": 52,
        "y": 32,
        "r": 6.5
      }
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 7,
    "scoringType": "position",
    "prerequisites": [
      "stop-1"
    ],
    "xp": 110,
    "skillEffects": {
      "Cue-Ball Control": 6
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "follow-1",
    "name": "Natural Follow Zone",
    "category": "Follow",
    "difficulty": 2,
    "purpose": "Send the cue ball forward after a straight pocket with high tip.",
    "setup": "Straight into TR; CB zone farther along the shot line past the OB.",
    "instructions": "Pocket the 3 into TR and follow the cue ball into the forward zone. Tip above center.",
    "tip": "High tip • smooth acceleration • let the CB roll, do not poke",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 20.5,
          "y": 36.0
        },
        {
          "id": 3,
          "x": 48,
          "y": 24
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 64.5,
        "y": 16.8,
        "r": 7
      },
      "arrows": [
        {
          "from": {
            "x": 48,
            "y": 24
          },
          "to": {
            "x": 64.5,
            "y": 16.8
          }
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 6,
    "scoringType": "position",
    "prerequisites": [
      "follow-1"
    ],
    "xp": 130,
    "skillEffects": {
      "Cue-Ball Control": 7
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "follow-2",
    "name": "Follow Across Window",
    "category": "Follow",
    "difficulty": 4,
    "purpose": "Follow then take a short natural curve into a side window.",
    "setup": "Straightish into TR; zone below-right of OB for a soft follow turn.",
    "instructions": "Pocket the 6 into TR with follow so the CB drifts into the lower zone for shape.",
    "tip": "High tip • medium — too soft dies; too hard races past",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 26.3,
          "y": 33.0
        },
        {
          "id": 6,
          "x": 52,
          "y": 22
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 58,
        "y": 34,
        "r": 7
      },
      "arrows": [
        {
          "from": {
            "x": 52,
            "y": 22
          },
          "to": {
            "x": 58,
            "y": 34
          }
        }
      ]
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "position",
    "prerequisites": [
      "follow-2"
    ],
    "xp": 150,
    "skillEffects": {
      "Cue-Ball Control": 8
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "follow-3",
    "name": "Long Follow Carry",
    "category": "Follow",
    "difficulty": 6,
    "purpose": "Carry the cue ball a long distance with follow after potting.",
    "setup": "Straight into TR; distant CB zone near the foot-right area.",
    "instructions": "Pocket the 4 into TR and follow all the way into the far zone without scratching.",
    "tip": "High tip • fuller stroke • stay down — peeking kills roll",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 19.6,
          "y": 27.9
        },
        {
          "id": 4,
          "x": 50,
          "y": 18
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 78,
        "y": 36,
        "r": 8
      },
      "arrows": [
        {
          "from": {
            "x": 50,
            "y": 18
          },
          "to": {
            "x": 78,
            "y": 36
          }
        }
      ]
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "position",
    "prerequisites": [
      "follow-2"
    ],
    "xp": 140,
    "skillEffects": {
      "Cue-Ball Control": 7,
      "Position Play": 3
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "follow-rail",
    "name": "Follow Off the Rail Path",
    "category": "Follow",
    "difficulty": 5,
    "purpose": "Follow forward then use a soft rail glance into a zone.",
    "setup": "Straight into BR; zone near bottom rail mid-right.",
    "instructions": "Pocket the 2 into BR with follow so CB continues and settles in the rail-side zone.",
    "tip": "Plan the rail touch before you shoot — speed is the aim",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 31.4,
          "y": 17.2
        },
        {
          "id": 2,
          "x": 55,
          "y": 28
        }
      ],
      "targetPocket": "BR",
      "zone": {
        "x": 70,
        "y": 42,
        "r": 7
      }
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 7,
    "scoringType": "position",
    "prerequisites": [
      "follow-1"
    ],
    "xp": 115,
    "skillEffects": {
      "Cue-Ball Control": 6
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "follow-side",
    "name": "Side Follow Extension",
    "category": "Follow",
    "difficulty": 3,
    "purpose": "Follow through a side-pocket straight for length.",
    "setup": "Straight into TM from below; zone between OB and pocket.",
    "instructions": "Pocket the 8 into TM and follow the CB into the upper zone.",
    "tip": "High tip • soft-medium — sides punish overhit more than corners",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 34.0,
          "y": 38.3
        },
        {
          "id": 8,
          "x": 42,
          "y": 20
        }
      ],
      "targetPocket": "TM",
      "zone": {
        "x": 45,
        "y": 10,
        "r": 6
      }
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 7,
    "scoringType": "position",
    "prerequisites": [
      "stop-1"
    ],
    "xp": 120,
    "skillEffects": {
      "Cue-Ball Control": 7
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "draw-1",
    "name": "Short Draw Zone",
    "category": "Draw",
    "difficulty": 3,
    "purpose": "Pull the cue ball back a short distance with low tip.",
    "setup": "Short straight into TR; CB zone behind the OB along the shot line.",
    "instructions": "Pocket the 4 into TR and draw the cue ball back into the zone. Tip below center with a level cue.",
    "tip": "Low tip • accelerate • keep cue as level as possible",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 33.2,
          "y": 32.0
        },
        {
          "id": 4,
          "x": 55,
          "y": 22
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 40.5,
        "y": 28.7,
        "r": 7
      },
      "arrows": [
        {
          "from": {
            "x": 55,
            "y": 22
          },
          "to": {
            "x": 40.5,
            "y": 28.7
          }
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 6,
    "scoringType": "position",
    "prerequisites": [
      "draw-1"
    ],
    "xp": 140,
    "skillEffects": {
      "Cue-Ball Control": 8
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "draw-2",
    "name": "Mid Draw Window",
    "category": "Draw",
    "difficulty": 5,
    "purpose": "Control draw distance into a mid-table window.",
    "setup": "Straight into TR; zone mid-table behind contact.",
    "instructions": "Pocket the 7 into TR and draw into the marked window. Judge distance by tip height and stroke length — not by arming it.",
    "tip": "Same tip height, change stroke length to tune distance",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 38.7,
          "y": 31.5
        },
        {
          "id": 7,
          "x": 62,
          "y": 20
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 42,
        "y": 30,
        "r": 7
      },
      "arrows": [
        {
          "from": {
            "x": 62,
            "y": 20
          },
          "to": {
            "x": 42,
            "y": 30
          }
        }
      ]
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "position",
    "prerequisites": [
      "draw-2"
    ],
    "xp": 170,
    "skillEffects": {
      "Cue-Ball Control": 9
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "draw-3",
    "name": "Power Draw Window",
    "category": "Draw",
    "difficulty": 7,
    "purpose": "Draw a long way back without miscueing.",
    "setup": "Straight into TR; far CB zone near the head-string left side.",
    "instructions": "Pocket the 5 into TR and power-draw into the far zone. Warm up tip contact first.",
    "tip": "Chalk well • slightly open bridge • explode through, do not jab",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 42.5,
          "y": 27.7
        },
        {
          "id": 5,
          "x": 68,
          "y": 16
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 22,
        "y": 30,
        "r": 8
      },
      "arrows": [
        {
          "from": {
            "x": 68,
            "y": 16
          },
          "to": {
            "x": 22,
            "y": 30
          }
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 6,
    "scoringType": "position",
    "prerequisites": [
      "draw-1"
    ],
    "xp": 125,
    "skillEffects": {
      "Cue-Ball Control": 7
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "draw-side",
    "name": "Side-Pocket Draw",
    "category": "Draw",
    "difficulty": 4,
    "purpose": "Draw away from a side pocket after potting.",
    "setup": "Straight into TM; zone below OB toward bottom of table.",
    "instructions": "Pocket the 1 into TM and draw the CB down into the zone.",
    "tip": "Level cue matters more on sides — elevated cues kill draw",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 50.0,
          "y": 38.0
        },
        {
          "id": 1,
          "x": 50,
          "y": 16
        }
      ],
      "targetPocket": "TM",
      "zone": {
        "x": 50,
        "y": 32,
        "r": 7
      }
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "position",
    "prerequisites": [
      "draw-2",
      "cut-2"
    ],
    "xp": 155,
    "skillEffects": {
      "Cue-Ball Control": 8,
      "Shot Making": 3
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "draw-cut",
    "name": "Draw Off a Half Cut",
    "category": "Draw",
    "difficulty": 6,
    "purpose": "Combine draw with a cut so CB pulls off the tangent.",
    "setup": "Halfish cut into BR; zone left of contact.",
    "instructions": "Cut the 3 into BR with draw so the CB finishes in the left zone rather than sliding on the tangent.",
    "tip": "Aim the cut first, then add low — never the reverse",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "HALF-BALL"
      },
      "balls": [
        {
          "id": "cue",
          "x": 31.0,
          "y": 25.0
        },
        {
          "id": 3,
          "x": 58,
          "y": 28
        }
      ],
      "targetPocket": "BR",
      "zone": {
        "x": 40,
        "y": 22,
        "r": 7
      }
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 6,
    "scoringType": "position",
    "prerequisites": [
      "stop-1",
      "cut-1"
    ],
    "xp": 135,
    "skillEffects": {
      "Cue-Ball Control": 7
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "stun-1",
    "name": "Stun Across Line",
    "category": "Stun",
    "difficulty": 4,
    "purpose": "Use stun so CB leaves on the tangent after a half-ball cut.",
    "setup": "Half-ball cut into TL; CB zone along the expected tangent path.",
    "instructions": "Cut the 2 into TL with stun (center tip, firm). CB should slide into the tangent zone — not follow or draw.",
    "tip": "Center tip • firm • watch the 90° tangent from the aim line",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "HALF-BALL"
      },
      "balls": [
        {
          "id": "cue",
          "x": 61.2,
          "y": 42.0
        },
        {
          "id": 2,
          "x": 40,
          "y": 20
        }
      ],
      "targetPocket": "TL",
      "zone": {
        "x": 48,
        "y": 32,
        "r": 7
      }
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "position",
    "prerequisites": [
      "stun-1"
    ],
    "xp": 145,
    "skillEffects": {
      "Cue-Ball Control": 7,
      "Position Play": 3
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "stun-2",
    "name": "Stun to Side Window",
    "category": "Stun",
    "difficulty": 5,
    "purpose": "Stun a half-ball so CB lands in a shape window for the next ball.",
    "setup": "Half-ball into TR; zone south of contact for next-ball shape.",
    "instructions": "Cut the 6 into TR with stun into the zone. Call the CB path before you shoot.",
    "tip": "If CB follows, you were rolling — reset to true stun",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "HALF-BALL"
      },
      "balls": [
        {
          "id": "cue",
          "x": 34.9,
          "y": 42.0
        },
        {
          "id": 6,
          "x": 55,
          "y": 22
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 58,
        "y": 34,
        "r": 6.5
      }
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "position",
    "prerequisites": [
      "stun-2"
    ],
    "xp": 155,
    "skillEffects": {
      "Cue-Ball Control": 8
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "stun-thin",
    "name": "Thin-Cut Stun Drift",
    "category": "Stun",
    "difficulty": 6,
    "purpose": "Feel how thin cuts send CB nearly along the aim line under stun.",
    "setup": "Quarter-ball cut into BR; zone along the near-forward stun path.",
    "instructions": "Cut the 4 into BR thin with stun. CB should drift into the forward zone.",
    "tip": "Thin + stun ≈ CB keeps much of its path — plan the miss line too",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "¼ BALL"
      },
      "balls": [
        {
          "id": "cue",
          "x": 34.8,
          "y": 8.0
        },
        {
          "id": 4,
          "x": 50,
          "y": 25
        }
      ],
      "targetPocket": "BR",
      "zone": {
        "x": 62,
        "y": 30,
        "r": 7
      }
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 7,
    "scoringType": "position",
    "prerequisites": [
      "stop-1"
    ],
    "xp": 110,
    "skillEffects": {
      "Cue-Ball Control": 5
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "stun-straight",
    "name": "Running Stun Check",
    "category": "Stun",
    "difficulty": 3,
    "purpose": "Contrast stun vs stop on a short straight.",
    "setup": "Short straight into BR; tight zone on OB spot.",
    "instructions": "Pocket the 9 with center-ball stun. CB should finish in the small zone.",
    "tip": "Short distance: stun and stop look similar — use this as a feel check",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 44.1,
          "y": 21.2
        },
        {
          "id": 9,
          "x": 62,
          "y": 30
        }
      ],
      "targetPocket": "BR",
      "zone": {
        "x": 62,
        "y": 30,
        "r": 5.5
      }
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 7,
    "scoringType": "position",
    "prerequisites": [],
    "xp": 90,
    "skillEffects": {
      "Speed Control": 8
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "TOO HARD / TOO SOFT (OUTSIDE ZONE)",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "SCRATCH OR WILD",
        "weight": 0
      }
    ],
    "id": "speed-1",
    "name": "Lag to Foot Zone",
    "category": "Speed Control",
    "difficulty": 2,
    "purpose": "Lag the cue ball to a distant zone without scratching.",
    "setup": "Cue ball near head string center. No object ball. Zone near foot rail center-right.",
    "instructions": "From behind the head string, lag the cue ball into the foot zone. Count only rests inside the circle.",
    "tip": "Feather the stroke • listen to the cloth • stop the cue in a straight line",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 25,
          "y": 25
        }
      ],
      "zone": {
        "x": 82,
        "y": 25,
        "r": 8
      },
      "arrows": [
        {
          "from": {
            "x": 25,
            "y": 25
          },
          "to": {
            "x": 82,
            "y": 25
          }
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 7,
    "scoringType": "position",
    "prerequisites": [
      "speed-1",
      "sm-straight-1"
    ],
    "xp": 110,
    "skillEffects": {
      "Speed Control": 7,
      "Shot Making": 3
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "speed-2",
    "name": "Soft Pocket Speed",
    "category": "Speed Control",
    "difficulty": 3,
    "purpose": "Pocket with the softest speed that still holds the line.",
    "setup": "Shortish straight into TR; tiny CB zone near OB (barely moves).",
    "instructions": "Pocket the 1 into TR as softly as possible while still potting cleanly. CB should barely leave the zone.",
    "tip": "If you miss soft, your aim line is wrong — soft reveals truth",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 40.0,
          "y": 27.6
        },
        {
          "id": 1,
          "x": 62,
          "y": 18
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 62,
        "y": 18,
        "r": 6
      }
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 6,
    "scoringType": "position",
    "prerequisites": [
      "speed-2",
      "follow-1"
    ],
    "xp": 140,
    "skillEffects": {
      "Speed Control": 8
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "speed-3",
    "name": "Two-Speed Follow Ladder",
    "category": "Speed Control",
    "difficulty": 5,
    "purpose": "Hit the same shot at two intentional follow distances.",
    "setup": "Straight into TR; zone for medium follow. Alternate soft vs medium attempts.",
    "instructions": "Odd attempts: soft follow just past OB. Even attempts: medium follow into the far edge of the zone. Track both.",
    "tip": "Change stroke length, not tip height, between the two speeds",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 21.9,
          "y": 32.3
        },
        {
          "id": 8,
          "x": 48,
          "y": 22
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 70,
        "y": 16,
        "r": 8
      }
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "position",
    "prerequisites": [
      "speed-1"
    ],
    "xp": 120,
    "skillEffects": {
      "Speed Control": 8
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "TOO HARD / TOO SOFT (OUTSIDE ZONE)",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "SCRATCH OR WILD",
        "weight": 0
      }
    ],
    "id": "speed-lag-corner",
    "name": "Corner-to-Corner Lag",
    "category": "Speed Control",
    "difficulty": 4,
    "purpose": "Lag the length of the table into a corner-area zone.",
    "setup": "Cue near BL area; zone near TR without scratching.",
    "instructions": "Lag from the bottom-left area into the top-right zone. Soft touches only — no rail carom required.",
    "tip": "Pick a cloth sound you like and repeat it",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 12,
          "y": 40
        }
      ],
      "zone": {
        "x": 85,
        "y": 12,
        "r": 8
      },
      "arrows": [
        {
          "from": {
            "x": 12,
            "y": 40
          },
          "to": {
            "x": 85,
            "y": 12
          }
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 7,
    "scoringType": "position",
    "prerequisites": [
      "follow-1",
      "stop-1"
    ],
    "xp": 120,
    "skillEffects": {
      "Position Play": 7
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "cbpos-1",
    "name": "One-Zone Shape",
    "category": "Cue-Ball Position",
    "difficulty": 3,
    "purpose": "Pocket and land in one intentional shape zone.",
    "setup": "Straight into TR; zone lower-right for a simple next-ball angle.",
    "instructions": "Pocket the 2 into TR and leave CB in the zone using whatever legal spin/speed works.",
    "tip": "Choose follow or stun before you address — commit",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 22.2,
          "y": 33.4
        },
        {
          "id": 2,
          "x": 50,
          "y": 22
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 62,
        "y": 34,
        "r": 7
      }
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "position",
    "prerequisites": [
      "cbpos-1",
      "cut-2"
    ],
    "xp": 145,
    "skillEffects": {
      "Position Play": 8
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "cbpos-2",
    "name": "Angle-In Shape Hold",
    "category": "Cue-Ball Position",
    "difficulty": 5,
    "purpose": "Hold shape after an angled cut.",
    "setup": "Half-ball into TL; zone for outbound shape.",
    "instructions": "Cut the 3 into TL and land in the zone. Prefer stun/follow over sidespin at this stage.",
    "tip": "Shape beats fancy english — center-ball first",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "HALF-BALL"
      },
      "balls": [
        {
          "id": "cue",
          "x": 55.6,
          "y": 41.3
        },
        {
          "id": 3,
          "x": 35,
          "y": 18
        }
      ],
      "targetPocket": "TL",
      "zone": {
        "x": 48,
        "y": 36,
        "r": 6.5
      }
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 4,
    "scoringType": "position",
    "prerequisites": [
      "cbpos-2"
    ],
    "xp": 160,
    "skillEffects": {
      "Position Play": 8
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "cbpos-3",
    "name": "Two-Rail Idea Zone",
    "category": "Cue-Ball Position",
    "difficulty": 6,
    "purpose": "Send CB on a planned multi-rail path into a zone.",
    "setup": "Mild cut into BR; zone near top rail for next shape.",
    "instructions": "Pocket the 9 into BR so CB takes a natural path into the top zone. Draw the path with your hand first.",
    "tip": "Natural roll paths beat forced english for consistency",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "¾ BALL"
      },
      "balls": [
        {
          "id": "cue",
          "x": 30.8,
          "y": 29.7
        },
        {
          "id": 9,
          "x": 60,
          "y": 32
        }
      ],
      "targetPocket": "BR",
      "zone": {
        "x": 72,
        "y": 12,
        "r": 7
      }
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "position",
    "prerequisites": [
      "cbpos-2",
      "pattern-2"
    ],
    "xp": 175,
    "skillEffects": {
      "Position Play": 9,
      "Pattern Play": 4
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "cbpos-keyball",
    "name": "Key-Ball Window",
    "category": "Cue-Ball Position",
    "difficulty": 7,
    "purpose": "Leave a precise window for a key ball before the 8.",
    "setup": "Short straight into TR; tight zone that would set up a key ball on the center line.",
    "instructions": "Pocket the 4 into TR and stop/follow into the tight key-ball window. Precision over power.",
    "tip": "Key-ball shape is usually soft — leave yourself an easy angle",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 51.4,
          "y": 31.8
        },
        {
          "id": 4,
          "x": 70,
          "y": 20
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 50,
        "y": 28,
        "r": 5.5
      }
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "position",
    "prerequisites": [
      "cbpos-1"
    ],
    "xp": 150,
    "skillEffects": {
      "Position Play": 7
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "cbpos-recover",
    "name": "Recovery Shape Zone",
    "category": "Cue-Ball Position",
    "difficulty": 6,
    "purpose": "Recover acceptable shape from a tough angle.",
    "setup": "Toughish cut into BL; generous recovery zone mid-table.",
    "instructions": "Cut the 6 into BL and get CB somewhere in the recovery zone. Good enough beats perfect when you are out of line.",
    "tip": "Pick the zone center, not a diamond — reduce decision load",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "HALF-BALL"
      },
      "balls": [
        {
          "id": "cue",
          "x": 73.6,
          "y": 33.1
        },
        {
          "id": 6,
          "x": 45,
          "y": 30
        }
      ],
      "targetPocket": "BL",
      "zone": {
        "x": 55,
        "y": 25,
        "r": 9
      }
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 7,
    "scoringType": "binary",
    "prerequisites": [
      "sm-straight-1"
    ],
    "xp": 120,
    "skillEffects": {
      "Shot Making": 7
    },
    "outcomes": null,
    "id": "cut-1",
    "name": "Quarter-Ball Cuts",
    "category": "Cut Shots",
    "difficulty": 3,
    "purpose": "Pocket consistent quarter-ball cuts.",
    "setup": "Object ball upper-right; cue placed for about quarter-ball into TR.",
    "instructions": "Cut the 5 into TR at quarter-ball thickness. Use the ghost ball — do not guess the edge.",
    "tip": "See the ghost, then stroke to it • medium firm",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "¼ BALL"
      },
      "balls": [
        {
          "id": "cue",
          "x": 45.4,
          "y": 42.0
        },
        {
          "id": 5,
          "x": 58,
          "y": 22
        }
      ],
      "targetPocket": "TR",
      "paths": [
        {
          "points": [
            {
              "x": 45.4,
              "y": 42.0
            },
            {
              "x": 58,
              "y": 22
            },
            {
              "x": 97.5,
              "y": 2.5
            }
          ],
          "dashed": true
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 7,
    "scoringType": "binary",
    "prerequisites": [
      "cut-1"
    ],
    "xp": 130,
    "skillEffects": {
      "Shot Making": 8
    },
    "outcomes": null,
    "id": "cut-2",
    "name": "Half-Ball Accuracy",
    "category": "Cut Shots",
    "difficulty": 4,
    "purpose": "Lock in the classic half-ball aim picture.",
    "setup": "Object ball left-center; cue for a true half-ball (~30°) into TL.",
    "instructions": "Cut the 2 into TL at half-ball. Confirm the ghost label reads HALF-BALL before each stroke.",
    "tip": "Half-ball is your reference cut — memorize the look",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "HALF-BALL"
      },
      "cutLabel": "HALF-BALL",
      "balls": [
        {
          "id": "cue",
          "x": 56.3,
          "y": 37.8
        },
        {
          "id": 2,
          "x": 45,
          "y": 25
        }
      ],
      "targetPocket": "TL",
      "paths": [
        {
          "points": [
            {
              "x": 56.3,
              "y": 37.8
            },
            {
              "x": 45,
              "y": 25
            },
            {
              "x": 2.5,
              "y": 2.5
            }
          ],
          "dashed": true
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 6,
    "scoringType": "binary",
    "prerequisites": [
      "cut-2",
      "sm-thin-cut-intro"
    ],
    "xp": 150,
    "skillEffects": {
      "Shot Making": 8
    },
    "outcomes": null,
    "id": "cut-thin-iii",
    "name": "Thin Cut Ladder",
    "category": "Cut Shots",
    "difficulty": 6,
    "purpose": "Pocket thin cuts without overcutting into the rail.",
    "setup": "Thin cut into BR from mid-table.",
    "instructions": "Thin-cut the 7 into BR. If you hit rail-first, you overcut — aim fuller next try.",
    "tip": "Trust thin • hit firm enough to avoid throw surprises",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "THIN"
      },
      "balls": [
        {
          "id": "cue",
          "x": 48.4,
          "y": 13.8
        },
        {
          "id": 7,
          "x": 55,
          "y": 28
        }
      ],
      "targetPocket": "BR",
      "paths": [
        {
          "points": [
            {
              "x": 48.4,
              "y": 13.8
            },
            {
              "x": 55,
              "y": 28
            },
            {
              "x": 97.5,
              "y": 47.5
            }
          ],
          "dashed": true
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 6,
    "scoringType": "binary",
    "prerequisites": [
      "cut-2",
      "sm-side-1"
    ],
    "xp": 140,
    "skillEffects": {
      "Shot Making": 7
    },
    "outcomes": null,
    "id": "cut-side-half",
    "name": "Half-Ball Side Cut",
    "category": "Cut Shots",
    "difficulty": 5,
    "purpose": "Cut half-ball into a side pocket.",
    "setup": "Half-ball into BM.",
    "instructions": "Cut the 3 into BM at half-ball. Sides are smaller — speed soft-medium.",
    "tip": "Aim deep in the pocket • avoid hanging the jaw",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "HALF-BALL"
      },
      "balls": [
        {
          "id": "cue",
          "x": 38.0,
          "y": 8.0
        },
        {
          "id": 3,
          "x": 50,
          "y": 30
        }
      ],
      "targetPocket": "BM",
      "paths": [
        {
          "points": [
            {
              "x": 38.0,
              "y": 8.0
            },
            {
              "x": 50,
              "y": 30
            },
            {
              "x": 50.0,
              "y": 48.2
            }
          ],
          "dashed": true
        }
      ]
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "binary",
    "prerequisites": [
      "cut-1",
      "sm-straight-2"
    ],
    "xp": 145,
    "skillEffects": {
      "Shot Making": 7
    },
    "outcomes": null,
    "id": "cut-long-mild",
    "name": "Long Mild Cut",
    "category": "Cut Shots",
    "difficulty": 5,
    "purpose": "Hold a small cut angle over a long distance.",
    "setup": "Long three-quarter ball into BR.",
    "instructions": "Cut the 8 into BR gently. Distance amplifies aim error — slow your routine.",
    "tip": "Breath out • last look at OB • commit",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "¾ BALL"
      },
      "balls": [
        {
          "id": "cue",
          "x": 42.8,
          "y": 9.5
        },
        {
          "id": 8,
          "x": 70,
          "y": 35
        }
      ],
      "targetPocket": "BR",
      "paths": [
        {
          "points": [
            {
              "x": 42.8,
              "y": 9.5
            },
            {
              "x": 70,
              "y": 35
            },
            {
              "x": 97.5,
              "y": 47.5
            }
          ],
          "dashed": true
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 7,
    "scoringType": "binary",
    "prerequisites": [
      "cut-1"
    ],
    "xp": 125,
    "skillEffects": {
      "Shot Making": 6
    },
    "outcomes": null,
    "id": "cut-both-ways",
    "name": "Mirror Cut Practice",
    "category": "Cut Shots",
    "difficulty": 4,
    "purpose": "Practice the same cut thickness mirrored to the other corner.",
    "setup": "Quarter/half cut into BL (mirror geometry).",
    "instructions": "Cut the 4 into BL. Alternate with Quarter-Ball Cuts in a session to balance both sides of your stroke.",
    "tip": "If one side is weaker, do double reps on that side",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "¼ BALL"
      },
      "balls": [
        {
          "id": "cue",
          "x": 46.9,
          "y": 8.0
        },
        {
          "id": 4,
          "x": 32,
          "y": 32
        }
      ],
      "targetPocket": "BL",
      "paths": [
        {
          "points": [
            {
              "x": 46.9,
              "y": 8.0
            },
            {
              "x": 32,
              "y": 32
            },
            {
              "x": 2.5,
              "y": 47.5
            }
          ],
          "dashed": true
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 6,
    "scoringType": "position",
    "prerequisites": [
      "cbpos-1"
    ],
    "xp": 125,
    "skillEffects": {
      "Position Play": 6
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "rail-1",
    "name": "Rail Hang Shape",
    "category": "Rail Position",
    "difficulty": 3,
    "purpose": "Pocket a near-rail ball and keep CB off the rail for shape.",
    "setup": "OB near right rail; soft shot into TR; zone off-rail mid-right.",
    "instructions": "Pocket the 2 near the rail into TR and leave CB in the off-rail zone (not frozen).",
    "tip": "Frozen CB kills options — leave a ball-width of grass",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 50,
          "y": 35
        },
        {
          "id": 2,
          "x": 85,
          "y": 25
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 70,
        "y": 30,
        "r": 7
      }
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "position",
    "prerequisites": [
      "rail-1",
      "follow-2"
    ],
    "xp": 140,
    "skillEffects": {
      "Position Play": 7
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "rail-2",
    "name": "Top-Rail Leave",
    "category": "Rail Position",
    "difficulty": 4,
    "purpose": "Use the top rail as a position bumper into a zone.",
    "setup": "OB near top rail into TM; zone after a soft rail touch.",
    "instructions": "Pocket the 5 into TM so CB kisses the top rail gently and settles in the zone.",
    "tip": "Rail is a cushion, not a trampoline — soft speed",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "¾ BALL"
      },
      "balls": [
        {
          "id": "cue",
          "x": 35,
          "y": 28
        },
        {
          "id": 5,
          "x": 50,
          "y": 8
        }
      ],
      "targetPocket": "TM",
      "zone": {
        "x": 65,
        "y": 16,
        "r": 7
      }
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "position",
    "prerequisites": [
      "rail-2"
    ],
    "xp": 150,
    "skillEffects": {
      "Position Play": 7
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "rail-3",
    "name": "Long-Rail Slide Zone",
    "category": "Rail Position",
    "difficulty": 5,
    "purpose": "Slide along a long rail path into a target zone.",
    "setup": "Cut into BL; zone along left rail mid-height.",
    "instructions": "Pocket the 3 into BL and use stun/follow so CB travels near the left rail into the zone without freezing.",
    "tip": "Leave half a ball off the rail for the next stroke",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "HALF-BALL"
      },
      "balls": [
        {
          "id": "cue",
          "x": 45,
          "y": 18
        },
        {
          "id": 3,
          "x": 20,
          "y": 25
        }
      ],
      "targetPocket": "BL",
      "zone": {
        "x": 14,
        "y": 18,
        "r": 6.5
      }
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 4,
    "scoringType": "position",
    "prerequisites": [
      "rail-1"
    ],
    "xp": 155,
    "skillEffects": {
      "Position Play": 7,
      "Shot Making": 3
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "rail-escape",
    "name": "Rail Escape Window",
    "category": "Rail Position",
    "difficulty": 6,
    "purpose": "Escape a near-rail OB and still land usable shape.",
    "setup": "OB near bottom-right rail into BR; generous mid-table zone.",
    "instructions": "Pocket the 6 into BR from a rail-adjacent lie and recover into the mid-table zone.",
    "tip": "Prioritize the pocket — shape is recovery, not perfection",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 40,
          "y": 25
        },
        {
          "id": 6,
          "x": 75,
          "y": 40
        }
      ],
      "targetPocket": "BR",
      "zone": {
        "x": 50,
        "y": 22,
        "r": 8
      }
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "position",
    "prerequisites": [
      "cbpos-1",
      "sm-straight-1"
    ],
    "xp": 130,
    "skillEffects": {
      "Pattern Play": 8
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "pattern-1",
    "name": "Two-Ball Pattern",
    "category": "Pattern Play",
    "difficulty": 3,
    "purpose": "Plan and execute a simple two-ball sequence with shape.",
    "setup": "Ball 1 near center into TR; ball 2 near right rail for BR. Cue near head string.",
    "instructions": "Pocket 1 into TR with shape on 2, then pocket 2 into BR. Pass needs both balls and CB not scratched.",
    "tip": "Decide the 1→2 CB path before touching the cue ball",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 22,
          "y": 32
        },
        {
          "id": 1,
          "x": 50,
          "y": 22
        },
        {
          "id": 2,
          "x": 78,
          "y": 30
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 65,
        "y": 28,
        "r": 8
      },
      "paths": [
        {
          "points": [
            {
              "x": 22,
              "y": 32
            },
            {
              "x": 50,
              "y": 22
            },
            {
              "x": 97.5,
              "y": 2.5
            }
          ],
          "dashed": true
        }
      ]
    }
  }),
  D({
    "attempts": 6,
    "passNeed": 4,
    "scoringType": "position",
    "prerequisites": [
      "pattern-1"
    ],
    "xp": 160,
    "skillEffects": {
      "Pattern Play": 9
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "pattern-2",
    "name": "Three-Ball Sequence Map",
    "category": "Pattern Play",
    "difficulty": 5,
    "purpose": "Map a three-ball route before shooting.",
    "setup": "Three object balls in a clear order toward the foot end; cue with BIH near head string.",
    "instructions": "Run 1→2→3 in order (prefer TR, BR, BM). Pass if all three pocket without a scratch.",
    "tip": "Trace the path with your hand over the cloth first",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 20,
          "y": 28
        },
        {
          "id": 1,
          "x": 42,
          "y": 18
        },
        {
          "id": 2,
          "x": 60,
          "y": 32
        },
        {
          "id": 3,
          "x": 78,
          "y": 16
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 55,
        "y": 25,
        "r": 10
      }
    }
  }),
  D({
    "attempts": 6,
    "passNeed": 3,
    "scoringType": "position",
    "prerequisites": [
      "pattern-2"
    ],
    "xp": 170,
    "skillEffects": {
      "Pattern Play": 9
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "pattern-3",
    "name": "Hold-the-Line Pattern",
    "category": "Pattern Play",
    "difficulty": 6,
    "purpose": "Keep CB on a planned line across three positions.",
    "setup": "Two OBs plus an 8; clear center-table lanes.",
    "instructions": "Clear 1 and 2 with intentional zones, then pocket the 8 into BR. Scratching on the 8 fails the attempt.",
    "tip": "Never leave a tough 8 on purpose — sell out early if needed",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 25,
          "y": 35
        },
        {
          "id": 1,
          "x": 48,
          "y": 20
        },
        {
          "id": 2,
          "x": 68,
          "y": 34
        },
        {
          "id": 8,
          "x": 82,
          "y": 18
        }
      ],
      "targetPocket": "BR",
      "zone": {
        "x": 70,
        "y": 22,
        "r": 8
      }
    }
  }),
  D({
    "attempts": 6,
    "passNeed": 3,
    "scoringType": "position",
    "prerequisites": [
      "pattern-2"
    ],
    "xp": 180,
    "skillEffects": {
      "Pattern Play": 8,
      "Safeties": 3
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "pattern-cluster",
    "name": "Cluster Breakout Plan",
    "category": "Pattern Play",
    "difficulty": 7,
    "purpose": "Plan which ball opens a two-ball cluster.",
    "setup": "Two balls nearly touching mid-right; a third hanger; cue with angle on the key ball.",
    "instructions": "Pocket the key ball (1) into TR so the cluster separates favorably, then finish the open ball. Pass on planned breakout + next pocket.",
    "tip": "If the breakout angle is wrong, play safe instead — count that as miss for this drill",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 30,
          "y": 36
        },
        {
          "id": 1,
          "x": 55,
          "y": 22
        },
        {
          "id": 2,
          "x": 60,
          "y": 26
        },
        {
          "id": 3,
          "x": 88,
          "y": 10
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 70,
        "y": 30,
        "r": 8
      }
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 5,
    "scoringType": "binary",
    "prerequisites": [
      "sm-straight-2",
      "cut-2"
    ],
    "xp": 150,
    "skillEffects": {
      "Banks": 9
    },
    "outcomes": null,
    "id": "bank-1",
    "name": "Cross-Corner Bank",
    "category": "Banks",
    "difficulty": 5,
    "purpose": "Bank an object ball cross-corner off the top rail into BR.",
    "setup": "OB left of center; cue lower-left; bank path off top rail to BR.",
    "instructions": "Bank the 3 off the top rail into BR. Use diamond equivalents you trust — medium firm.",
    "tip": "Firm enough to ignore cloth grab • center tip first",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 22,
          "y": 38
        },
        {
          "id": 3,
          "x": 40,
          "y": 28
        }
      ],
      "targetPocket": "BR",
      "paths": [
        {
          "points": [
            {
              "x": 40,
              "y": 28
            },
            {
              "x": 55,
              "y": 3.5
            },
            {
              "x": 97.5,
              "y": 47.5
            }
          ],
          "dashed": true,
          "color": "#65e9ff"
        },
        {
          "points": [
            {
              "x": 22,
              "y": 38
            },
            {
              "x": 40,
              "y": 28
            },
            {
              "x": 55.0,
              "y": 3.5
            }
          ],
          "dashed": true
        }
      ]
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 4,
    "scoringType": "binary",
    "prerequisites": [
      "bank-1"
    ],
    "xp": 165,
    "skillEffects": {
      "Banks": 9
    },
    "outcomes": null,
    "id": "bank-2",
    "name": "Cross-Side Bank",
    "category": "Banks",
    "difficulty": 6,
    "purpose": "Bank across into a side pocket.",
    "setup": "OB below center; bank off top rail into TM.",
    "instructions": "Bank the 5 off the top rail into TM. Softer than cross-corner — sides punish speed.",
    "tip": "Track the mirror point through the rail",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 28,
          "y": 38
        },
        {
          "id": 5,
          "x": 50,
          "y": 32
        }
      ],
      "targetPocket": "TM",
      "paths": [
        {
          "points": [
            {
              "x": 50,
              "y": 32
            },
            {
              "x": 50,
              "y": 3.5
            },
            {
              "x": 50.0,
              "y": 1.8
            }
          ],
          "dashed": true,
          "color": "#65e9ff"
        }
      ]
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 4,
    "scoringType": "binary",
    "prerequisites": [
      "bank-2"
    ],
    "xp": 180,
    "skillEffects": {
      "Banks": 10
    },
    "outcomes": null,
    "id": "bank-3",
    "name": "Short Rail Bank",
    "category": "Banks",
    "difficulty": 7,
    "purpose": "Bank off the short (foot) rail into a corner.",
    "setup": "OB in the upper-right quadrant; cue mid-left; bank off the right short rail into TR.",
    "instructions": "Bank the 2 off the right short rail into TR. Measure equal angles from the rail normal.",
    "tip": "Short-rail banks need cleaner hit — less room to recover",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 45,
          "y": 32
        },
        {
          "id": 2,
          "x": 70,
          "y": 20
        }
      ],
      "targetPocket": "TR",
      "paths": [
        {
          "points": [
            {
              "x": 70,
              "y": 20
            },
            {
              "x": 96,
              "y": 25
            },
            {
              "x": 97.5,
              "y": 2.5
            }
          ],
          "dashed": true,
          "color": "#65e9ff"
        }
      ]
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 4,
    "scoringType": "binary",
    "prerequisites": [
      "bank-1"
    ],
    "xp": 160,
    "skillEffects": {
      "Banks": 8
    },
    "outcomes": null,
    "id": "bank-long",
    "name": "Long-Rail Return Bank",
    "category": "Banks",
    "difficulty": 6,
    "purpose": "Bank off the bottom long rail into BM.",
    "setup": "OB upper-left; bank off bottom rail into BM.",
    "instructions": "Bank the 4 off the bottom rail into BM. Keep speed consistent between attempts.",
    "tip": "Same speed every rep — banks are a calibration drill",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 20,
          "y": 35
        },
        {
          "id": 4,
          "x": 35,
          "y": 20
        }
      ],
      "targetPocket": "BM",
      "paths": [
        {
          "points": [
            {
              "x": 35,
              "y": 20
            },
            {
              "x": 50,
              "y": 46.5
            },
            {
              "x": 50.0,
              "y": 48.2
            }
          ],
          "dashed": true,
          "color": "#65e9ff"
        }
      ]
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 6,
    "scoringType": "binary",
    "prerequisites": [
      "speed-1",
      "sm-straight-1"
    ],
    "xp": 140,
    "skillEffects": {
      "Kicks": 8
    },
    "outcomes": null,
    "id": "kick-1",
    "name": "One-Rail Kick Contact",
    "category": "Kicks",
    "difficulty": 4,
    "purpose": "Kick one rail to make contact with a blocked object ball.",
    "setup": "OB frozen near right-center; cue cannot see it directly — kick off top rail to contact.",
    "instructions": "Kick the cue ball off the top rail to contact the 3. Pocketing is bonus; clean first contact passes.",
    "tip": "Mirror systems beat guesswork — pick a diamond and repeat",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 25,
          "y": 35
        },
        {
          "id": 3,
          "x": 70,
          "y": 22
        }
      ],
      "paths": [
        {
          "points": [
            {
              "x": 25,
              "y": 35
            },
            {
              "x": 50,
              "y": 3.5
            },
            {
              "x": 70,
              "y": 22
            }
          ],
          "dashed": true,
          "color": "#ffc75b"
        }
      ],
      "zone": {
        "x": 70,
        "y": 22,
        "r": 5
      }
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 4,
    "scoringType": "binary",
    "prerequisites": [
      "kick-1"
    ],
    "xp": 170,
    "skillEffects": {
      "Kicks": 9
    },
    "outcomes": null,
    "id": "kick-2",
    "name": "Two-Rail Kick Line",
    "category": "Kicks",
    "difficulty": 6,
    "purpose": "Send CB on a two-rail kick line to a target ball.",
    "setup": "Cue near BL; kick top rail then right rail to contact OB near BR area.",
    "instructions": "Two-rail kick to contact the 5. Mark your intended rail diamonds before each try.",
    "tip": "Speed consistency matters as much as aim on two rails",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 20,
          "y": 40
        },
        {
          "id": 5,
          "x": 70,
          "y": 40
        }
      ],
      "paths": [
        {
          "points": [
            {
              "x": 20,
              "y": 40
            },
            {
              "x": 40,
              "y": 3.5
            },
            {
              "x": 96,
              "y": 28
            },
            {
              "x": 70,
              "y": 40
            }
          ],
          "dashed": true,
          "color": "#ffc75b"
        }
      ],
      "zone": {
        "x": 70,
        "y": 40,
        "r": 5.5
      }
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 3,
    "scoringType": "binary",
    "prerequisites": [
      "kick-2",
      "bank-1"
    ],
    "xp": 200,
    "skillEffects": {
      "Kicks": 10,
      "Shot Making": 3
    },
    "outcomes": null,
    "id": "kick-3",
    "name": "Kick to Pocket",
    "category": "Kicks",
    "difficulty": 8,
    "purpose": "Kick an object ball into a pocket (kick shot make).",
    "setup": "OB near TR but blocked; kick CB off top rail into OB toward TR.",
    "instructions": "Kick into the 2 so it pockets in TR. Contact alone is not enough — the OB must drop.",
    "tip": "Hit OB fuller than you think after a long kick — energy is lost",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 30,
          "y": 38
        },
        {
          "id": 2,
          "x": 88,
          "y": 12
        }
      ],
      "targetPocket": "TR",
      "paths": [
        {
          "points": [
            {
              "x": 30,
              "y": 38
            },
            {
              "x": 75,
              "y": 3.5
            },
            {
              "x": 88,
              "y": 12
            }
          ],
          "dashed": true,
          "color": "#ffc75b"
        },
        {
          "points": [
            {
              "x": 88,
              "y": 12
            },
            {
              "x": 97.5,
              "y": 2.5
            }
          ],
          "dashed": true
        }
      ]
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "binary",
    "prerequisites": [
      "kick-1"
    ],
    "xp": 150,
    "skillEffects": {
      "Kicks": 8
    },
    "outcomes": null,
    "id": "kick-short",
    "name": "Short-Rail Kick Find",
    "category": "Kicks",
    "difficulty": 5,
    "purpose": "Kick off a short rail to find a hidden ball.",
    "setup": "Cue near bottom center; kick left short rail to OB near TL area.",
    "instructions": "One-rail kick off the left short rail to contact the 6. First contact passes.",
    "tip": "Shorter kicks = tighter aim — slow down your walk-in",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 50,
          "y": 40
        },
        {
          "id": 6,
          "x": 30,
          "y": 12
        }
      ],
      "paths": [
        {
          "points": [
            {
              "x": 50,
              "y": 40
            },
            {
              "x": 3.5,
              "y": 25
            },
            {
              "x": 30,
              "y": 12
            }
          ],
          "dashed": true,
          "color": "#ffc75b"
        }
      ],
      "zone": {
        "x": 30,
        "y": 12,
        "r": 5
      }
    }
  }),
  D({
    "attempts": 10,
    "passNeed": 7,
    "scoringType": "position",
    "prerequisites": [
      "speed-1"
    ],
    "xp": 130,
    "skillEffects": {
      "Safeties": 8
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "safe-1",
    "name": "Distance Safety",
    "category": "Safeties",
    "difficulty": 3,
    "purpose": "Leave the opponent long and without a natural angle.",
    "setup": "Cue and OB mid-table; send OB toward a rail and hide CB distance near opposite end.",
    "instructions": "Thin or soft-stun the 2 toward the top rail and park CB near the bottom rail zone. Success = distance + no easy make (honor system).",
    "tip": "Safety success is measured by difficulty left — not by how cute it looks",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 40,
          "y": 30
        },
        {
          "id": 2,
          "x": 55,
          "y": 25
        }
      ],
      "zone": {
        "x": 20,
        "y": 40,
        "r": 8
      },
      "arrows": [
        {
          "from": {
            "x": 40,
            "y": 30
          },
          "to": {
            "x": 20,
            "y": 40
          }
        }
      ]
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "position",
    "prerequisites": [
      "safe-1"
    ],
    "xp": 150,
    "skillEffects": {
      "Safeties": 9
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "safe-2",
    "name": "Rail Hook Safety",
    "category": "Safeties",
    "difficulty": 5,
    "purpose": "Hook the opponent behind a rail using a thin contact.",
    "setup": "OB near top rail; cue mid; send OB along rail and CB behind head-string clutter zone.",
    "instructions": "Play a thin safety on the 4 so it stays near the top rail and CB finishes in the hook zone near BL.",
    "tip": "Thin is safer than stun for freeze-to-rail leaves",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "THIN"
      },
      "balls": [
        {
          "id": "cue",
          "x": 45,
          "y": 32
        },
        {
          "id": 4,
          "x": 50,
          "y": 12
        }
      ],
      "targetPocket": "TM",
      "zone": {
        "x": 15,
        "y": 40,
        "r": 7
      }
    }
  }),
  D({
    "attempts": 8,
    "passNeed": 5,
    "scoringType": "position",
    "prerequisites": [
      "safe-2",
      "cut-2"
    ],
    "xp": 170,
    "skillEffects": {
      "Safeties": 9,
      "Shot Making": 3
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "safe-3",
    "name": "Two-Way Shot Safety",
    "category": "Safeties",
    "difficulty": 6,
    "purpose": "Choose a shot that either makes or leaves a strong safe.",
    "setup": "Tough cut on 3 into TR with a natural miss line that hooks; zone for the safe leave.",
    "instructions": "Attempt the cut on 3 into TR. If it misses, CB/OB should finish as a safety in the zone (two-way). Score zone on either make+shape OR intentional safe leave.",
    "tip": "True two-ways have a planned miss — not a prayer",
    "diagram": {
      "showGhostBall": true,
      "ghostBall": {
        "label": "¼ BALL"
      },
      "balls": [
        {
          "id": "cue",
          "x": 49.4,
          "y": 42.0
        },
        {
          "id": 3,
          "x": 62,
          "y": 20
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 28,
        "y": 18,
        "r": 8
      }
    }
  }),
  D({
    "attempts": 6,
    "passNeed": 3,
    "scoringType": "position",
    "prerequisites": [
      "safe-2"
    ],
    "xp": 180,
    "skillEffects": {
      "Safeties": 10
    },
    "outcomes": [
      {
        "id": "zone",
        "label": "SUCCESS — IN TARGET ZONE",
        "weight": 1
      },
      {
        "id": "pocketed",
        "label": "POCKETED BUT MISSED POSITION",
        "weight": 0.5
      },
      {
        "id": "miss",
        "label": "MISSED SHOT",
        "weight": 0
      }
    ],
    "id": "safe-snooker",
    "name": "Full Hook Hide",
    "category": "Safeties",
    "difficulty": 7,
    "purpose": "Park CB fully hidden behind a blocker ball.",
    "setup": "Blocker 8 near center; OB near top; cue sends CB behind 8 while nudging OB to rail.",
    "instructions": "Contact the 2 softly to a rail and hide CB behind the 8 in the zone. Opponent should need a kick.",
    "tip": "Speed first, hide second — overhit ruins both",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 30,
          "y": 35
        },
        {
          "id": 2,
          "x": 48,
          "y": 20
        },
        {
          "id": 8,
          "x": 55,
          "y": 32
        }
      ],
      "zone": {
        "x": 62,
        "y": 36,
        "r": 6
      }
    }
  }),
  D({
    "attempts": 6,
    "passNeed": 4,
    "scoringType": "binary",
    "prerequisites": [
      "pattern-1",
      "cbpos-1"
    ],
    "xp": 150,
    "skillEffects": {
      "Pattern Play": 8,
      "Shot Making": 4
    },
    "outcomes": null,
    "id": "run-1",
    "name": "Three-Ball Runout",
    "category": "Runouts",
    "difficulty": 4,
    "purpose": "Clear three open balls without a miss.",
    "setup": "Three well-spaced balls; cue with ball-in-hand behind head string.",
    "instructions": "With BIH behind the head string, run the 1, 2, and 3. Any miss or scratch fails the attempt.",
    "tip": "BIH is a gift — place for the whole run, not just the first ball",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 18,
          "y": 25
        },
        {
          "id": 1,
          "x": 40,
          "y": 18
        },
        {
          "id": 2,
          "x": 58,
          "y": 34
        },
        {
          "id": 3,
          "x": 78,
          "y": 16
        }
      ],
      "targetPocket": "TR"
    }
  }),
  D({
    "attempts": 5,
    "passNeed": 3,
    "scoringType": "binary",
    "prerequisites": [
      "run-1",
      "pattern-2"
    ],
    "xp": 180,
    "skillEffects": {
      "Pattern Play": 9
    },
    "outcomes": null,
    "id": "run-2",
    "name": "Five-Ball Runout",
    "category": "Runouts",
    "difficulty": 6,
    "purpose": "Execute a five-ball clearance under focus.",
    "setup": "Five open balls; BIH behind head string.",
    "instructions": "Run five balls in any order. Pause between balls only to plan — no re-racks mid-attempt.",
    "tip": "If you lose the next shape, stop and reassess rather than force",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 15,
          "y": 28
        },
        {
          "id": 1,
          "x": 35,
          "y": 16
        },
        {
          "id": 2,
          "x": 48,
          "y": 34
        },
        {
          "id": 3,
          "x": 62,
          "y": 18
        },
        {
          "id": 4,
          "x": 74,
          "y": 36
        },
        {
          "id": 5,
          "x": 86,
          "y": 20
        }
      ],
      "targetPocket": "TR"
    }
  }),
  D({
    "attempts": 6,
    "passNeed": 4,
    "scoringType": "binary",
    "prerequisites": [
      "run-2",
      "cbpos-keyball"
    ],
    "xp": 190,
    "skillEffects": {
      "Pattern Play": 8,
      "Shot Making": 5
    },
    "outcomes": null,
    "id": "run-3",
    "name": "Pressure 8 Finish",
    "category": "Runouts",
    "difficulty": 7,
    "purpose": "Finish an 8-ball style last two under pressure.",
    "setup": "One object ball left plus the 8; cue in a slight awkward place (no BIH).",
    "instructions": "Pocket your last object ball with shape on the 8, then pocket the 8 into BR. Scratch on 8 fails.",
    "tip": "Leave the 8 straight when nervous — avoid thin pressure cuts",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 32,
          "y": 36
        },
        {
          "id": 1,
          "x": 55,
          "y": 20
        },
        {
          "id": 8,
          "x": 78,
          "y": 32
        }
      ],
      "targetPocket": "BR",
      "zone": {
        "x": 65,
        "y": 28,
        "r": 7
      }
    }
  }),
  D({
    "attempts": 4,
    "passNeed": 2,
    "scoringType": "binary",
    "prerequisites": [
      "run-3"
    ],
    "xp": 220,
    "skillEffects": {
      "Pattern Play": 10
    },
    "outcomes": null,
    "id": "run-bi-h-clear",
    "name": "BIH Clear Ladder",
    "category": "Runouts",
    "difficulty": 8,
    "purpose": "From ball-in-hand, clear a six-ball layout including the 8.",
    "setup": "Six-ball problem rack spread; BIH anywhere.",
    "instructions": "Place CB anywhere legal and clear all balls ending on the 8 into a called corner. Two clean clears to pass.",
    "tip": "Spend 30 seconds planning before the first stroke",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 20,
          "y": 25
        },
        {
          "id": 1,
          "x": 38,
          "y": 14
        },
        {
          "id": 2,
          "x": 48,
          "y": 32
        },
        {
          "id": 3,
          "x": 60,
          "y": 16
        },
        {
          "id": 4,
          "x": 70,
          "y": 34
        },
        {
          "id": 5,
          "x": 82,
          "y": 20
        },
        {
          "id": 8,
          "x": 90,
          "y": 38
        }
      ],
      "targetPocket": "TR"
    }
  }),
  D({
    "attempts": 5,
    "passNeed": 2,
    "scoringType": "binary",
    "prerequisites": [
      "run-2"
    ],
    "xp": 200,
    "skillEffects": {
      "Pattern Play": 9,
      "Position Play": 5
    },
    "outcomes": null,
    "id": "run-rotation-lite",
    "name": "Rotation Four-Pack",
    "category": "Runouts",
    "difficulty": 7,
    "purpose": "Run four balls in numerical order (rotation lite).",
    "setup": "Balls 1–4 open; cue near head string; must pocket in order 1→2→3→4.",
    "instructions": "Pocket 1 through 4 in order. Shape for the next number every shot. Out-of-order pocket fails the attempt.",
    "tip": "Rotation is shape discipline — sell out early if the next is tough",
    "diagram": {
      "showGhostBall": false,
      "balls": [
        {
          "id": "cue",
          "x": 18,
          "y": 30
        },
        {
          "id": 1,
          "x": 40,
          "y": 20
        },
        {
          "id": 2,
          "x": 55,
          "y": 34
        },
        {
          "id": 3,
          "x": 68,
          "y": 16
        },
        {
          "id": 4,
          "x": 84,
          "y": 28
        }
      ],
      "targetPocket": "TR",
      "zone": {
        "x": 50,
        "y": 28,
        "r": 9
      }
    }
  }),
];

export const drills = [...baseDrills, ...extraDrills];

export function getDrillById(id) {
  return drills.find((d) => d.id === id) || null;
}

export function drillsByCategory() {
  const map = {};
  for (const c of CATEGORIES) map[c] = [];
  for (const d of drills) {
    if (!map[d.category]) map[d.category] = [];
    map[d.category].push(d);
  }
  return map;
}

export function isDrillUnlocked(drill, state) {
  if (!drill.prerequisites || !drill.prerequisites.length) return true;
  return drill.prerequisites.every((pid) => state.results[pid]?.passed);
}

export function renderDrillMini(drill, compact = true) {
  return renderTableDiagram(drill.diagram || { balls: [] }, {
    compact,
    className: compact ? 'table-diagram mini' : 'table-diagram'
  });
}

export default drills;
