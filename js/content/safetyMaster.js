/**
 * Safety Master — its own course, listed with the Billiard University exams.
 * It is not a Billiard University exam. Diagrams are the printed table photos.
 * The printed cue-tip circle and lag-to-break bar stay with each drill.
 * No Career Rank XP. Not Ball Pocketing levels. None are locked.
 * Finishing every drill from this course records one accomplishment.
 * Playing a drill from its category does not finish the course.
 */
import { challengeFromPkfDoc } from './pkfBuiltins.js';
import { validatePooliq } from './schema.js';

export const SAFETY_NAME = 'Safety Master';

const DRILLS = [
  {
    "id": "sm-01",
    "name": "Stun Follow 1",
    "category": "Follow",
    "heading": "STUN FOLLOW",
    "quote": "Create distance between CB and OB",
    "time": "1:13",
    "text": "In this layout we need to play an effective safety by putting the cue ball behind the 6 ball and sending the 4 ball to the other end of the table. In this shot we’ll be using a stun follow shot - we’ll be striking the cue ball firm and using center high to force the cue ball behind the 6 ball ‘A’. If your cue ball ends up going too far ‘B’ then try the shot again at the same speed but use slightly less high spin."
  },
  {
    "id": "sm-02",
    "name": "Stun Follow 2",
    "category": "Follow",
    "heading": "STUN FOLLOW",
    "quote": "Create distance between CB and OB",
    "time": "2:07",
    "text": "In this game of 9-Ball, we’re on the 4 ball and we need to lock up the cue ball behind the 5 ball. If struck correctly the cue ball should end up next to the 5 ball ‘A’ - the goal is to get close enough to the 5 ball that the opponent can’t use the bottom side rail for a kick shot."
  },
  {
    "id": "sm-03",
    "name": "Stun Follow 3",
    "category": "Follow",
    "heading": "STUN FOLLOW",
    "quote": "Create distance between CB and OB",
    "time": "3:07",
    "text": "Here is another example of a stun follow safety. In this shot we’re going to put the cue ball behind the 8 ball ‘A’ and bank the 5 ball two rails. When performing these stun follow shots, determine your speed first then find where you need to strike the cue ball for that speed. Once you find a good speed try to keep it consistent until you can successfully execute the shot."
  },
  {
    "id": "sm-04",
    "name": "Stun Follow 4",
    "category": "Follow",
    "heading": "STUN FOLLOW",
    "quote": "Create distance between the cue ball and object ball",
    "time": "1:39",
    "text": "In this layout we’re going to use a stun follow shot to send the 4 ball two rails while putting the cue ball behind the 6 and 8 ball ‘A’. When playing shots like these really zero in on striking the cue ball with the proper amount of high spin."
  },
  {
    "id": "sm-05",
    "name": "Stun Follow 5",
    "category": "Follow",
    "heading": "STUN FOLLOW",
    "quote": "Create distance between the cue ball and object ball",
    "time": "",
    "text": "In this practice drill, shoot the object ball into the corner pocket using different speeds. The goal is to move the cue ball a specific distance each time ‘A’, ‘B’, or ‘C’. So on the first shot we’ll be moving the cue ball half a diamond using different speeds. Also, move the cue ball back once you become consistent at this shot ‘1’ and ‘2’."
  },
  {
    "id": "sm-06",
    "name": "Bank to Safe Zone 1",
    "category": "Banks",
    "heading": "BANK TO SAFE ZONE",
    "quote": "Send the object ball close to the end rail",
    "time": "3:45",
    "text": "This safety requires a bit of practice since we’re controlling the speed of the object ball. The goal is to send the 5 ball as close as possible to the opposite end rail - the cue ball should end up near the side rail ideally behind the 7 ball ‘A’. This shot comes up quite a bit especially near the end of 9-Ball games."
  },
  {
    "id": "sm-07",
    "name": "Bank to Safe Zone 2",
    "category": "Banks",
    "heading": "BANK TO SAFE ZONE",
    "quote": "Send the object ball close to the end rail",
    "time": "4:25",
    "text": "Here is the same shot - once again we’ll be banking the object ball to the end rail. Focus on finding your aim point on the first end rail. When players first try this shot they tend to over cut the shot ‘B’. Keep practicing this shot until you can land the object ball in the safe zone."
  },
  {
    "id": "sm-08",
    "name": "Bank to Safe Zone 3",
    "category": "Banks",
    "heading": "BANK TO SAFE ZONE",
    "quote": "Send the object ball close to the end rail",
    "time": "5:28",
    "text": "In this common safety we’ll be banking the 8 ball two rails toward the middle of the end rail and sending the cue ball to the opposite end rail ‘A’. Ideally we would like to get the object ball as close as possible to the end rail. This shot definitely requires practice to develop a feel for the speed and how much of the object ball you need to strike."
  },
  {
    "id": "sm-09",
    "name": "Bank to Safe Zone 4",
    "category": "Banks",
    "heading": "BANK TO SAFE ZONE",
    "quote": "Send the OB close to the end rail",
    "time": "5:58",
    "text": "This shot is actually much easier than it looks. We’ll be shooting the 8 ball with a firm stroke sending it five rails to the end rail while sending the cue ball toward the 9 ball ‘A’."
  },
  {
    "id": "sm-10",
    "name": "Bank to Safe Zone 5",
    "category": "Banks",
    "heading": "BANK TO SAFE ZONE",
    "quote": "Send the OB close to the end rail",
    "time": "6:24",
    "text": "In this safety we’re going to bank the ball to our safe zone while sending the cue ball to the other end rail ‘A’. Our main goal on this shot is to make sure the 6 ball ends up close to the middle diamond on the end rail - if we can get the cue ball on the other side of the 9 ball that would be a bonus."
  },
  {
    "id": "sm-11",
    "name": "Bank to Safe Zone 6",
    "category": "Banks",
    "heading": "BANK TO SAFE ZONE",
    "quote": "Send the OB close to the end rail",
    "time": "6:58",
    "text": "In this safety we’ll be banking the 7 ball to the end rail and sending the cue ball to the opposite end rail. If the 8 ball weren’t on the table then we could try just sending the cue ball on this path ‘A’ leaving a tough shot for our opponent. Since the 8 ball is about a diamond distance from the end rail in this layout, we’ll be sending the cue ball on this path ‘B’ in the hopes of hiding it behind the 8 ball."
  },
  {
    "id": "sm-12",
    "name": "Two Way Shots 1",
    "category": "Safeties",
    "heading": "TWO WAY SHOTS",
    "quote": "Shots that allow offense and defense",
    "time": "8:15",
    "text": "In this game of 8-Ball, we’re on the 8 ball but we really don’t have a good offensive shot. We could bank the 8 ball in the bottom left corner pocket but if we miss we’ll probably leave a fairly easy shot for our opponent. But, if we try the bank shot with left sidespin to throw the 8 ball slightly, we can use a slight draw stroke to put the cue ball close to the 10 ball ‘A’."
  },
  {
    "id": "sm-13",
    "name": "Two Way Shots 2",
    "category": "Safeties",
    "heading": "TWO WAY SHOTS",
    "quote": "Shots that allow offense and defense",
    "time": "8:34",
    "text": "In this 8-Ball game we’re on the 8 ball but we don’t have a good offensive shot. The bank shot in the top right corner pocket is risky since we’ll probably leave our opponent a shot if we miss. But, if we try the bank shot using a stun follow stroke, we can send the cue ball to the area next to the 11 ball ‘A’, leaving my opponent without a good shot if we miss the bank."
  },
  {
    "id": "sm-14",
    "name": "Two Way Shots 3",
    "category": "Safeties",
    "heading": "TWO WAY SHOTS",
    "quote": "Shots that allow offense and defense",
    "time": "9:35",
    "text": "Here’s another 8 ball shot where we’ll be banking it into the corner and leaving our opponent a tough shot in case we miss. These shots come up quite often in 8-Ball so it’s important to become familiar with them."
  },
  {
    "id": "sm-15",
    "name": "Two Way Shots 4",
    "category": "Safeties",
    "heading": "TWO WAY SHOTS",
    "quote": "Shots that allow offense and defense",
    "time": "10:07",
    "text": "In this layout we’re on the 8 ball and we can play it in either corner pocket. We would normally play it in the bottom right corner pocket but in doing so we would sell out if we miss the shot. Shooting the 8 ball into the top right corner pocket leaves our opponent a tough shot in case we miss ‘A’."
  },
  {
    "id": "sm-16",
    "name": "Two Way Shots 5",
    "category": "Safeties",
    "heading": "TWO WAY SHOTS",
    "quote": "Shots that allow offense and defense",
    "time": "10:32",
    "text": "It’s important to recognize shots like this where a carom shot will send the cue ball toward a pocket. When shooting these kinds of shots be aware of where the ball the 8 ball is striking is going to end up. In this example a carom shot will send the 10 ball toward the end rail which may leave our opponent tough if we miss. We’ll use draw to make our opponent’s shot even tougher ‘A’."
  },
  {
    "id": "sm-17",
    "name": "Close to Blocker Ball 1",
    "category": "Safeties",
    "heading": "CLOSE TO BLOCKER BALL",
    "quote": "Use nearby balls for defense",
    "time": "11:03",
    "text": "In this common safety shot we’ll be shooting the 4 ball four rails to the other half of the table while leaving the cue ball next to the 5 ball. The goal is to at least send the cue ball to the top side rail - ideally we would also like the cue ball as close as possible to the 5 ball ‘A’. This can be a devastating safety when executed properly."
  },
  {
    "id": "sm-18",
    "name": "Close to Blocker Ball 2",
    "category": "Safeties",
    "heading": "CLOSE TO BLOCKER BALL",
    "quote": "Use nearby balls for defense",
    "time": "11:41",
    "text": "In this 9-Ball game we’re on the 5 ball and we would like to play an effective safety. In this shot we’ll be banking the 5 ball toward the top side rail and attempting to put the cue ball as close as possible to the 8 ball. Since the cue ball and 5 ball are ending up on the same half of the table in this safety, it’s important we don’t leave too much space between the cue ball and 8 ball that would allow a kick off the top side rail."
  },
  {
    "id": "sm-19",
    "name": "Close to Blocker Ball 3",
    "category": "Safeties",
    "heading": "CLOSE TO BLOCKER BALL",
    "quote": "Use nearby balls for defense",
    "time": "12:04",
    "text": "In this 8-Ball game we’re on the solids but we don’t have any offensive shots. A nice shot here is to shoot at the 1 ball and draw back slightly putting the cue ball next to the 12 ball ‘A’. This breaks out our 1 ball and leaves our opponent in a very difficult situation."
  },
  {
    "id": "sm-20",
    "name": "Rack Area Safety 1",
    "category": "Safeties",
    "heading": "RACK AREA SAFETY",
    "quote": "Safe zones near the rack area",
    "time": "13:17",
    "text": "In this 9-Ball game we’re on the 5 ball and we need to play an effective safety. In many 9-Ball games there are usually two or three balls near the rack area in the early part of the game which we can use to our advantage when playing safe. In this shot we’ll be banking the 5 ball to the end rail while sending the cue ball four rails to the rack area. Be careful not to use too much sidespin when performing this shot."
  },
  {
    "id": "sm-21",
    "name": "Rack Area Safety 2",
    "category": "Safeties",
    "heading": "RACK AREA SAFETY",
    "quote": "Safe zones near the rack area",
    "time": "13:58",
    "text": "In this 9-Ball game we’ll be banking the 4 ball two rails toward the end rail while sending the cue ball to the rack area. It’s important we make sure that the 4 ball is struck hard enough to reach the middle of the end rail - we want to avoid leaving the 4 ball near the corner pocket. We’ll be using right sidespin to help propel the cue ball to our safe area ‘A’."
  },
  {
    "id": "sm-22",
    "name": "Rack Area Safety 3",
    "category": "Safeties",
    "heading": "RACK AREA SAFETY",
    "quote": "Safe zones near the rack area",
    "time": "14:19",
    "text": "In this 8-Ball game we’re on the solids but we don’t have a good offensive shot. We could thin the 2 ball and play a safety but our 1 ball is still tied up. A good option here would be to thin the 1 ball with running english sending the cue ball four rails to the rack area ‘A’. Make sure you strike the 1 ball extremely thin."
  },
  {
    "id": "sm-23",
    "name": "Rack Area Safety 4",
    "category": "Safeties",
    "heading": "RACK AREA SAFETY",
    "quote": "Safe zones near the rack area",
    "time": "14:38",
    "text": "In this 9-Ball game we’re on the 4 ball and we need to play an effective safety. In this shot we’re going to bank the 4 ball to the end rail while sending the cue ball two rails toward the end rail behind the rack area ‘A’. Shots like this where you can hide both object ball and cue ball come up quite a bit in the early parts of 9-Ball games."
  },
  {
    "id": "sm-24",
    "name": "Rack Area Safety 5",
    "category": "Safeties",
    "heading": "RACK AREA SAFETY",
    "quote": "Safe zones near the rack area",
    "time": "15:02",
    "text": "In this 9-Ball game we’re on the 3 ball and we need to play an effective safety. A good option here is to bank the 3 ball three rails to the rack area while putting the cue ball behind the 5, 6 and 7 ball ‘A’. When shooting this shot make sure you find your aiming spot on the end rail to send the 3 ball toward ‘B’."
  },
  {
    "id": "sm-25",
    "name": "High Action Safety 1",
    "category": "Safeties",
    "heading": "HIGH ACTION SAFETY",
    "quote": "Using force follow to hide the cue ball",
    "time": "15:39",
    "text": "In this 9-Ball game we need to play a safety on the 4 ball but there aren't any good hiding areas near the 4 ball. But, if we use high action, we can send the cue ball off the end rail and behind the 5, 7 and 8 ball. This shot takes practice since you’ll need to bank the 4 ball to the other half of the table while sending the cue ball off the end rail."
  },
  {
    "id": "sm-26",
    "name": "High Action Safety 2",
    "category": "Safeties",
    "heading": "HIGH ACTION SAFETY",
    "quote": "Using force follow to hide the cue ball",
    "time": "15:59",
    "text": "In this 9-Ball once again we’ll be using high action to send the cue ball behind blocker balls. The goal on this shot is to send the cue ball off the side rail and toward the blocker balls. We could play a simpler safety by banking the 5 to the end rail and leaving the cue ball here 'B’, but this leaves an easy jump or kick. Sending the cue ball off the side rail gives us a good chance of putting the cue ball close to a blocker ball ‘A’."
  },
  {
    "id": "sm-27",
    "name": "High Action Safety 3",
    "category": "Safeties",
    "heading": "HIGH ACTION SAFETY",
    "quote": "Using force follow to hide the cue ball",
    "time": "16:15",
    "text": "In this 9-Ball layout we’re on the 5 ball and we would like to use the 6 ball and 8 ball as blocker balls. The goal on this shot is to bank the 5 ball two rails toward the top side rail and put the cue ball on the other side of the 6 ball ‘A’. When shooting this shot make sure you don’t strike the 5 ball too hard which could leave your opponent a shot 'B’."
  },
  {
    "id": "sm-28",
    "name": "High Action Safety 4",
    "category": "Safeties",
    "heading": "HIGH ACTION SAFETY",
    "quote": "Using force follow to hide the cue ball",
    "time": "16:28",
    "text": "In this 9-Ball layout we’re on the 5 ball and we would like to use the 6 ball and 7 ball as blocker balls. If we can shoot the 5 ball with high action we should be able to send the cue ball behind the two blocker balls ‘A’. Make sure you determine the spot on the side rail where you need to send the cue ball before getting down on the shot ‘B’."
  },
  {
    "id": "sm-29",
    "name": "High Action Safety 5",
    "category": "Safeties",
    "heading": "HIGH ACTION SAFETY",
    "quote": "Using force follow to hide the cue ball",
    "time": "16:42",
    "text": "In this 8-Ball game we’re on the 1 ball and we don’t have a good offensive shot. A nice shot here is to use high action and send the cue ball behind the 8 ball ‘A’. This shot takes a bit of practice to know how much of the 1 ball you need to strike - once you have it down though, it’s a very repeatable shot."
  },
  {
    "id": "sm-30",
    "name": "Kick Safe 1",
    "category": "Kicks",
    "heading": "KICK SAFE",
    "quote": "Using the rails to play safe",
    "time": "17:11",
    "text": "Here’s a shot that came up in a recent Mosconi Cup match. In this shot the player is going to send the cue ball off the side rail kicking the 5 ball to the other half of the table - the cue ball will end up next to the 8 ball creating an effective safety. ‘A’ We’ll be shooting this shot with high spin which will help kill the cue ball’s speed when contacting the 5 ball."
  },
  {
    "id": "sm-31",
    "name": "Kick Safe 2",
    "category": "Kicks",
    "heading": "KICK SAFE",
    "quote": "Using the rails to play safe",
    "time": "17:35",
    "text": "Here’s a typical kick safe that comes up quite a bit in 9-Ball. In this shot we need to kick the 5 ball to the other end rail killing the cue ball ‘A’ - we’ll be using left sidespin which will allow us to strike the 5 ball at an angle sending it to the side rail."
  },
  {
    "id": "sm-32",
    "name": "Kick Safe 3",
    "category": "Kicks",
    "heading": "KICK SAFE",
    "quote": "Using the rails to play safe",
    "time": "18:38",
    "text": "In this 9-Ball game we’re on the 5 ball and we need to play a safety. We could play a kick safe sending the cue ball to the other end rail and leaving the cue ball near the 8 ball. While this creates a tough shot for our opponent a better option is to strike less of the 5 ball which will send the cue ball to the bottom side rail near the 6 and 9 ball ‘A’."
  },
  {
    "id": "sm-33",
    "name": "Kick Safe 4",
    "category": "Kicks",
    "heading": "KICK SAFE",
    "quote": "Using the rails to play safe",
    "time": "19:01",
    "text": "In this example the opponent just rolled out to this position on the 2 ball - even though the player is hooked on the 2 ball it’s still fairly easy to play safe. In this shot we’ll use left sidespin to come off the side rail striking the right side of the 2 ball which will send both balls toward opposite end rails. The cue ball should end up behind the wall of blocker balls ‘A’."
  },
  {
    "id": "sm-34",
    "name": "Kick Safe 5",
    "category": "Kicks",
    "heading": "KICK SAFE",
    "quote": "Using the rails to play safe",
    "time": "19:35",
    "text": "In this game of 8-Ball we’re on the stripes and we have an offensive shot on the 13 ball but it’s not easy and even if we make it the 15 ball is tied up making for a difficult run. A creative option here is to come off the end rail toward the 15 ball using a soft stroke - this will put the cue ball next to the 15 and 8 ball ‘A’ creating an effective safety."
  },
  {
    "id": "sm-35",
    "name": "Carom Safeties 1",
    "category": "Safeties",
    "heading": "CAROM SAFETIES",
    "quote": "Change the object ball’s path",
    "time": "20:16",
    "text": "In this 9-Ball game we’re on the 5 ball and we don’t have a good offensive shot. If we can carom the 5 ball off the 8 ball the 5 will be sent to the top side rail which means we can use the 7 and 9 ball as blocker balls for the cue ball ‘A’."
  },
  {
    "id": "sm-36",
    "name": "Carom Safeties 2",
    "category": "Safeties",
    "heading": "CAROM SAFETIES",
    "quote": "Change the object ball’s path",
    "time": "20:34",
    "text": "In this 9-Ball game we’re on the 5 ball and we need to play an effective safety. If we can carom the 5 ball off the 7 we can slide the cue ball over behind the 9 ball ‘A’ while sending the 5 ball off the side rail to the other side of the 6 and 9 ball."
  },
  {
    "id": "sm-37",
    "name": "Carom Safeties 3",
    "category": "Safeties",
    "heading": "CAROM SAFETIES",
    "quote": "Change the object ball’s path",
    "time": "21:01",
    "text": "In this 9-Ball game we’re on the 4 ball and we don’t have a good offensive shot. If we can send the 4 ball to the other half of the table and put the cue ball behind the 7 and 9 ball we would have a winning safety. By playing the 4 ball off the 6 ball we now have the angle to send the cue ball behind both blocker balls ‘A’ while sending the 4 ball to the other half of the table."
  },
  {
    "id": "sm-38",
    "name": "Carom Safeties 4",
    "category": "Safeties",
    "heading": "CAROM SAFETIES",
    "quote": "Change the object ball’s path",
    "time": "21:23",
    "text": "In this shot we need to carom the 3 ball off the 4 ball and draw the cue ball back behind the 5 ball ‘A’. Concentrate on just striking the left side of the 4 ball with the 3 ball."
  },
  {
    "id": "sm-39",
    "name": "Carom Safeties 5",
    "category": "Safeties",
    "heading": "CAROM SAFETIES",
    "quote": "Change the object ball’s path",
    "time": "21:52",
    "text": "In the later parts of a 9-Ball game it becomes more difficult to hide the cue ball, which is why it helps to be creative. In this layout we don’t have an obvious safety on the 5 ball - but, if we can bank the 5 ball off the side rail into the 8 ball we can send the 5 ball to the other half of the table while drawing the cue ball back to the end rail behind the 6 ball ‘A’."
  },
  {
    "id": "sm-40",
    "name": "Draw Safeties 1",
    "category": "Draw",
    "heading": "DRAW SAFETIES",
    "quote": "Using low spin to hide the cue ball",
    "time": "22:16",
    "text": "In this 9-Ball game we have a difficult cut shot on the 4 ball and going up and down for position on the 5 ball will be challenging. A winning safety here is to draw the cue ball off the 4 ball toward the end rail behind the 5 ball ‘A’. If you are struggling with this shot try shooting this shot from different cue ball locations ‘B’."
  },
  {
    "id": "sm-41",
    "name": "Draw Safeties 2",
    "category": "Draw",
    "heading": "DRAW SAFETIES",
    "quote": "Using low spin to hide the cue ball",
    "time": "22:36",
    "text": "In this situation we can bank the 3 in the corner and hope we get shape on the 4 ball, or we can play an effective safety by banking the 3 to the other side rail and drawing the cue ball behind the 6 ball ‘A’."
  },
  {
    "id": "sm-42",
    "name": "Draw Safeties 3",
    "category": "Draw",
    "heading": "DRAW SAFETIES",
    "quote": "Using low spin to hide the cue ball",
    "time": "23:14",
    "text": "In this 9-Ball game we have a tough cut shot on the 3 ball. We can either try the cut shot or we can play a nice safety by shooting the 3 ball with low action sending the cue ball off the side rail and toward the two blocker balls ‘A’."
  },
  {
    "id": "sm-43",
    "name": "Draw Safeties 4",
    "category": "Draw",
    "heading": "DRAW SAFETIES",
    "quote": "Using low spin to hide the cue ball",
    "time": "23:27",
    "text": "In this 9-Ball game we’re going to play a winning safety by banking the 3 ball to the other half of the table and drawing the cue ball toward the side rail and behind the 8 ball and 4 ball ‘A’."
  },
  {
    "id": "sm-44",
    "name": "Draw Safeties 5",
    "category": "Draw",
    "heading": "DRAW SAFETIES",
    "quote": "Using low spin to hide the cue ball",
    "time": "23:44",
    "text": "In this game of 9-Ball, we’re on the 3 ball and we need to play an effective safety. In this shot we’re going to bank the 3 and draw back to the end rail behind the 7 ball. This shot requires greater precision since we’re only hiding the cue ball behind one ball."
  },
  {
    "id": "sm-45",
    "name": "Draw Safeties 6",
    "category": "Draw",
    "heading": "DRAW SAFETIES",
    "quote": "Using low spin to hide the cue ball",
    "time": "24:16",
    "text": "In this 9-Ball scenario we have to be creative in how we play safe. We’re going to shoot the 4 into the 8 ball and draw the cue ball back to the side rail and over to the end rail behind the 6 ball ‘A’. Make sure you find your target on the side rail before shooting this shot ‘B’."
  },
  {
    "id": "sm-46",
    "name": "Off Rail Safety 1",
    "category": "Safeties",
    "heading": "OFF RAIL SAFETY",
    "quote": "Using the rails to lock up your opponent",
    "time": "24:46",
    "text": "Here’s an interesting safety that comes up quite often. In this safety we’re going to be sending the cue ball off the end rail just to the right of the 4 ball with left spin - this will send the 4 ball off the side rail and back near its starting location. The cue ball should head toward the other end rail ‘A’. On some occasions the object ball will find the pocket which is an added benefit."
  },
  {
    "id": "sm-47",
    "name": "Off Rail Safety 2",
    "category": "Safeties",
    "heading": "OFF RAIL SAFETY",
    "quote": "Using the rails to lock up your opponent",
    "time": "25:27",
    "text": "In this end game situation, we’re playing 9-Ball and we’re on the 7 ball. In this shot we’re going to attempt to break out the 7 ball and send the cue ball to the other end rail behind the 9 ball ‘A’. We’ll do this by coming off the end rail just before the 7 ball with running english."
  },
  {
    "id": "sm-48",
    "name": "Off Rail Safety 3",
    "category": "Safeties",
    "heading": "OFF RAIL SAFETY",
    "quote": "Using the rails to lock up your opponent",
    "time": "25:41",
    "text": "In this 9-Ball situation the 2 ball is tied up and there’s not enough room to shoot it past the 8 ball for a safety. But, if we can softly come off the side rail with running english it should contact the 2 ball and send the cue ball to the other side of the 8 ball for an effective safety ‘A’."
  },
  {
    "id": "sm-49",
    "name": "Reverse Spin Safeties 1",
    "category": "Safeties",
    "heading": "REVERSE SPIN SAFETIES",
    "quote": "Using reverse spin to change the cue ball’s path",
    "time": "26:20",
    "text": "In this game of 9-Ball we’re on the 7 ball and instead of playing the tough cut shot we’re going to play an effective safety. In this shot we’ll be banking the 7 ball to the other end rail and putting the cue ball behind the 8 ball ‘A’. We’ll be using reverse spin to not only slow down the cue ball but change its path off the side rail."
  },
  {
    "id": "sm-50",
    "name": "Reverse Spin Safeties 2",
    "category": "Safeties",
    "heading": "REVERSE SPIN SAFETIES",
    "quote": "Using reverse spin to change the cue ball’s path",
    "time": "26:33",
    "text": "Here’s a similar situation - in this shot we’ll be banking the 7 ball to the opposite side rail and sending the cue ball to the end rail behind the 8 ball ‘A’."
  },
  {
    "id": "sm-51",
    "name": "Reverse Spin Safeties 3",
    "category": "Safeties",
    "heading": "REVERSE SPIN SAFETIES",
    "quote": "Using reverse spin to change the cue ball’s path",
    "time": "26:52",
    "text": "Here is a typical safety shot that comes up in 9-Ball. In this shot we’ll be banking the 6 ball to the opposite side rail and putting the cue ball behind the 7 ball ‘A’. We’ll be using reverse spin to straighten the cue ball’s path off the side rail."
  },
  {
    "id": "sm-52",
    "name": "Reverse Spin Safeties 4",
    "category": "Safeties",
    "heading": "REVERSE SPIN SAFETIES",
    "quote": "Using reverse spin to change the cue ball’s path",
    "time": "27:12",
    "text": "In this game of 9-Ball we’ll be banking the 6 ball to the opposite end rail and putting the cue ball behind the 7 ball ‘A’. We’ll be using reverse spin to help kill the cue ball and straighten its path off the rail."
  },
  {
    "id": "sm-53",
    "name": "Reverse Spin Safeties 5",
    "category": "Safeties",
    "heading": "REVERSE SPIN SAFETIES",
    "quote": "Using reverse spin to change the cue ball’s path",
    "time": "27:26",
    "text": "This is a shot you’ll see professionals shoot quite often. In this shot we’ll be using reverse spin to kill the cue ball behind the 9 ball ‘A’ while banking the 7 ball to the other end rail."
  },
  {
    "id": "sm-54",
    "name": "Reverse Spin Safeties 6",
    "category": "Safeties",
    "heading": "REVERSE SPIN SAFETIES",
    "quote": "Using reverse spin to change the cue ball’s path",
    "time": "27:41",
    "text": "In this 8 ball game we’re playing solids and we don’t have any good offensive options. A good safety in this situation would be too lightly tap the 7 ball with reverse spin which should hide the cue ball behind the 7 ‘A’."
  },
  {
    "id": "sm-55",
    "name": "Stun Safeties 1",
    "category": "Stun",
    "heading": "STUN SAFETIES",
    "quote": "Using the tangent line to hide the cue ball",
    "time": "28:15",
    "text": "In this game of 9-Ball we’re going to use the tangent line to send the cue ball to its hiding spot behind the 9 and 7 ball ‘A’. The first thing we’ll do is make an educated guess as to what spot on the side rail we need to send the cue ball ‘B’. Next, we’ll place the cue stick alongside the object ball and point it toward ‘B’ (large view) - now we’ll visualize a 90 degree line that goes through the object ball. This line tells us where we need to aim the 5 ball ‘C’."
  },
  {
    "id": "sm-56",
    "name": "Stun Safeties 2",
    "category": "Stun",
    "heading": "STUN SAFETIES",
    "quote": "Using the tangent line to hide the cue ball",
    "time": "29:25",
    "text": "Here’s a similar shot. In this situation we’re going to hide the cue ball behind the 6 and 9 ball ‘A’. We’ll first find our aiming spot on the end rail ‘B’ and place our cue alongside the object ball and point it toward this spot. Now we’ll visualize the 90 degree line that runs through the object ball (magnified view), this now tells us where to aim the 5 ball ‘C’."
  },
  {
    "id": "sm-57",
    "name": "Stun Safeties 3",
    "category": "Stun",
    "heading": "STUN SAFETIES",
    "quote": "Using the tangent line to hide the cue ball",
    "time": "29:58",
    "text": "In this 8 ball game we’ll be putting the cue ball behind the 7 ball for an effective safety ‘A’. We’ll first make an educated guess as to where our contact point is on the side rail ‘B’. Next, we’ll place our cue stick alongside the object ball and point it toward ‘B’ (magnified view). We’ll then visualize the 90 degree line that runs through the object ball which gives us our aiming point ‘C’."
  },
  {
    "id": "sm-58",
    "name": "Stun Safeties 4",
    "category": "Stun",
    "heading": "STUN SAFETIES",
    "quote": "Using the tangent line to hide the cue ball",
    "time": "30:28",
    "text": "In this game of 9-Ball we’re on the 7 ball and we we’re going to put the cue ball behind the 9 ball ‘A’ while sending the 7 ball to the other half of the table. We’ll first find our target on the end rail that we need to send the cue ball toward ‘B’. We’ll then point our cue stick toward this target and visualize the 90 degree line that goes through the 7 ball (magnified view) - this now gives us our aiming point for the 7 ball on the side rail ‘C’."
  },
  {
    "id": "sm-59",
    "name": "Stun Safeties 5",
    "category": "Stun",
    "heading": "STUN SAFETIES",
    "quote": "Using the tangent line to hide the cue ball",
    "time": "31:08",
    "text": "In these practice drills we’ll be sending the cue ball to target balls along the side rail and end rail. In the first drill ‘A’ we’ll first send the cue ball to the third diamond. Once we become consistent at this shot we’ll then send the cue ball to the second diamond then the first. When setting up each shot find your aiming point for the object ball along the side rail. In drill 'B’ we’ll be sending the cue ball to different spots on the end rail."
  },
  {
    "id": "sm-60",
    "name": "Shoot into Ball 1",
    "category": "Safeties",
    "heading": "SHOOT INTO BALL",
    "quote": "Control the object ball using other balls",
    "time": "31:58",
    "text": "In this 9-Ball game we’re on the 2 ball and we need to play an effective safety. If we can shoot the 2 ball into the 4 ball the 2 ball should stay in that area - knowing this, if we can put the cue ball behind the 9 ball we should have a good safety ‘A’. Concentrate on striking the 4 ball as full as possible to kill the 2 ball’s speed."
  },
  {
    "id": "sm-61",
    "name": "Shoot into Ball 2",
    "category": "Safeties",
    "heading": "SHOOT INTO BALL",
    "quote": "Control the object ball using other balls",
    "time": "32:16",
    "text": "In this 9-Ball game if we can send the 3 ball into the 5 ball, the 3 ball should stay within the same area as the 5 ball - since we know where the 3 ball is going to end up we can send the cue ball behind the 9 ball for an effective safety ‘A’."
  },
  {
    "id": "sm-62",
    "name": "Shoot into Ball 3",
    "category": "Safeties",
    "heading": "SHOOT INTO BALL",
    "quote": "Control the object ball using other balls",
    "time": "32:28",
    "text": "In this 9-Ball game we’re on the 6 ball and we need to play a safety. We’ll shoot the 6 ball into the 7 ball which causes the 6 ball to stay within this area - if we use running english we can send the cue ball behind the blocker balls ‘A’."
  },
  {
    "id": "sm-63",
    "name": "Shoot into Ball 4",
    "category": "Safeties",
    "heading": "SHOOT INTO BALL",
    "quote": "Control the object ball using other balls",
    "time": "32:49",
    "text": "In this 8-Ball game we’re on the solids and we need to play a winning safety. If we can softly tap the 3 ball into the 11 ball the 3 ball should stay close to the 11 while the cue ball comes to a stop on the side rail for a nice safety."
  },
  {
    "id": "sm-64",
    "name": "Shoot into Ball 5",
    "category": "Safeties",
    "heading": "SHOOT INTO BALL",
    "quote": "Control the object ball using other balls",
    "time": "33:13",
    "text": "In this 9-Ball game we’re going to play a safety by putting the cue ball behind the 5 ball ‘A’. If we shoot the 3 ball into the 7 ball it won't give us the angle to move the cue ball behind the 5 ball - but, if we shoot the 3 ball into the end rail and into the 7 ball, this will give us the angle to move the cue ball behind the 5 ball."
  },
  {
    "id": "sm-65",
    "name": "Shoot into Ball 6",
    "category": "Safeties",
    "heading": "SHOOT INTO BALL",
    "quote": "Control the object ball using other balls",
    "time": "33:32",
    "text": "In this 9-Ball game we don’t have a good offensive shot on the 2 ball so we need to play a safety. A good safe to perform in this situation that is easy to execute is to shoot the 2 into the 7 ball and draw the cue ball back to the end rail behind the 9 ball ‘A’."
  },
  {
    "id": "sm-66",
    "name": "Side Rail Safety 1",
    "category": "Safeties",
    "heading": "SIDE RAIL SAFETY",
    "quote": "Sending both cue ball and object ball to the side rail",
    "time": "34:02",
    "text": "Here’s a typical safety that comes up quite often in 9-Ball. In this situation we’ll be banking the 4 ball to the side rail while sending the cue ball to the end rail behind the 9 ball ‘A’. If the 7 and 9 ball weren’t there then we can send the cue ball to this position 'B’ using the 5 ball as a blocker ball."
  },
  {
    "id": "sm-67",
    "name": "Side Rail Safety 2",
    "category": "Safeties",
    "heading": "SIDE RAIL SAFETY",
    "quote": "Sending both cue ball and object ball to the side rail",
    "time": "34:30",
    "text": "Here’s a similar situation where we’ll be sending both balls to the side rail. In this layout we have two blocker balls to help hide the cue ball (8 ball, 4 ball). If you’re playing against a player who is good at jumping you can lessen the amount of sidespin you use which will send the cue ball farther down the side rail 'B’."
  },
  {
    "id": "sm-68",
    "name": "Side Rail Safety 3",
    "category": "Safeties",
    "heading": "SIDE RAIL SAFETY",
    "quote": "Sending both cue ball and object ball to the side rail",
    "time": "34:42",
    "text": "Here’s another version of this type of safety. In this example we’ll be sending both balls to the top side rail since we have two blocker balls we can use to hide the cue ball (6 ball and 5 ball). If we use a little more speed we can send the cue ball all the way to the end rail behind the 8 ball ‘B’."
  },
  {
    "id": "sm-69",
    "name": "Slide Safety 1",
    "category": "Safeties",
    "heading": "SLIDE SAFETY",
    "quote": "Sliding the cue ball a small distance for a safety",
    "time": "35:16",
    "text": "In this safety we have a chance to really lock up our opponent behind the 8 ball. Since we only need to move the cue ball a very short distance we really need to be specific as to how much of the 1 ball we need to strike. We’ll first find the point on the rail where both balls are lined up ‘B’. Shooting toward 'B' won't move the cue ball anywhere, but aiming the 1 ball just below this target will be enough to move the cue ball toward the hiding area ‘A’."
  },
  {
    "id": "sm-70",
    "name": "Slide Safety 2",
    "category": "Safeties",
    "heading": "SLIDE SAFETY",
    "quote": "Sliding the cue ball a small distance for a safety",
    "time": "35:36",
    "text": "In this 9-Ball game we would like to put the cue ball behind the 9 ball for a safety. We’ll first find the point on the rail where both balls are line up 'B’ - then we’ll aim the 4 ball to the right of this target which will move the cue ball toward the hiding area ‘A’. These types of shots require many hours of practice to develop a feel for speed, where to aim on the cue ball and how much of the object ball to strike."
  },
  {
    "id": "sm-71",
    "name": "Slide Safety 3",
    "category": "Safeties",
    "heading": "SLIDE SAFETY",
    "quote": "Sliding the cue ball a small distance for a safety",
    "time": "36:01",
    "text": "In this 9-Ball game we’re on the 3 ball and we would like to slide the cue ball over a couple inches behind the 9 ball ‘A’. We’ll first find the point on the end rail where both balls are line up 'B’ - then we’ll aim the 4 ball to the left of this target which will move the cue ball toward the target area."
  },
  {
    "id": "sm-72",
    "name": "Thin Safety 1",
    "category": "Safeties",
    "heading": "THIN SAFETY",
    "quote": "Sliding the cue ball a small distance for a safety",
    "time": "37:00",
    "text": "Here’s a common safety that comes up quite often in 8-Ball. In this game we’re on the 8 ball and we can either try a tough offensive shot or we can lock up the cue ball behind the 8 ball ‘A’. This safety requires an extremely short backstroke since we’re only moving the cue ball a few inches. You can also shoot this shot with center."
  },
  {
    "id": "sm-73",
    "name": "Thin Safety 2",
    "category": "Safeties",
    "heading": "THIN SAFETY",
    "quote": "Sliding the cue ball a small distance for a safety",
    "time": "37:22",
    "text": "In this 9-Ball game we can only see a small part of the 3 ball, but the good news is that a thin hit on the 3 ball may result in a safety using the 7 ball as a blocker ball ‘A’. These types of shots require an extremely thin hit - when you try this shot you can use a touch of right spin to help straighten the cue ball’s path off the side rail."
  },
  {
    "id": "sm-74",
    "name": "Thin Safety 3",
    "category": "Safeties",
    "heading": "THIN SAFETY",
    "quote": "Sliding the cue ball a small distance for a safety",
    "time": "38:16",
    "text": "This is a typical shot that comes up in 8-Ball and 9-Ball games. In this situation we need to strike the 8 ball extremely thin sending the cue ball three rails to the other end rail ‘A’. When players first attempt this type of shot they tend to strike too much of the 8-Ball. If you’re struggling at this shot move the cue ball closer to the object ball 'B’. As you improve move the cue ball farther away (1, 2, 3)."
  },
  {
    "id": "sm-75",
    "name": "Two Rail Safeties 1",
    "category": "Safeties",
    "heading": "TWO RAIL SAFETIES",
    "quote": "Sending the cue ball off a rail toward the blocker ball",
    "time": "39:08",
    "text": "In this safety, we could just bank the 6 to the other half of the table and float the cue ball behind the 7 and 8 ball - but we would ideally like to really lock up the opponent. So in this shot we’re going to bank the 6 and go two rails toward the 7 ball with the cue ball ‘A’. This increases the chances of getting close to a blocker ball."
  },
  {
    "id": "sm-76",
    "name": "Two Rail Safeties 2",
    "category": "Safeties",
    "heading": "TWO RAIL SAFETIES",
    "quote": "Sending the cue ball off a rail toward the blocker ball",
    "time": "39:28",
    "text": "In this example, we have a thin cut shot on the 5 ball which is makeable, but if you’re not comfortable with this shot then you can try banking the 5 ball sending the cue ball two rails toward the 7 ball ‘A’."
  },
  {
    "id": "sm-77",
    "name": "Two Rail Safeties 3",
    "category": "Safeties",
    "heading": "TWO RAIL SAFETIES",
    "quote": "Sending the cue ball off a rail toward the blocker ball",
    "time": "39:50",
    "text": "In this 9-Ball game we have a couple options for playing safe, but the best option is to bank the 2 ball sending the cue ball two rails toward the 8 ball ‘A’. If executed correctly this is a devastating safety."
  }
];

export const SAFETY_ORDER = DRILLS.map((d) => d.id);
const BY_ID = Object.fromEntries(DRILLS.map((d) => [d.id, d]));

/** Bank drills from this course. Banks stays shelved for the old PKF drills. */
export const SAFETY_BANK_IDS = DRILLS.filter((d) => d.category === 'Banks').map((d) => d.id);

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function isSafetyId(id) { return Object.prototype.hasOwnProperty.call(BY_ID, id); }

export function safetyMeta(id) {
  const d = BY_ID[id];
  if (!d) return null;
  const i = SAFETY_ORDER.indexOf(id);
  return { ...d, index: i, next: i >= 0 && i < SAFETY_ORDER.length - 1 ? SAFETY_ORDER[i + 1] : null };
}

export function safetyText(id) {
  const d = BY_ID[id];
  if (!d) return '';
  const lines = [d.heading, `“${d.quote}”`];
  if (d.time) lines.push('', `time:${d.time}`);
  lines.push('', d.text);
  return lines.join('\n');
}

export function safetyImages(id) {
  return { table: `./images/safety/${id}.png`, tip: `./images/safety/${id}-tip.png` };
}

function docFor(d) {
  const text = safetyText(d.id);
  const goal = `“${d.quote}”`.slice(0, 240);
  return {
    format: 'pooliq',
    schemaVersion: '1.0',
    contentType: 'drill',
    id: d.id,
    contentVersion: '1.0',
    title: d.name,
    description: text.slice(0, 2000),
    category: d.category,
    difficulty: 2,
    skill: 'Safeties',
    rankXpEligible: false,
    shot: {
      kind: 'safety',
      speed: 2,
      cueContact: { vTips: 0, hTips: 0 },
      cueBallPosition: { x: 25, y: 12.5 },
      ballPositions: [{ n: 1, x: 75, y: 25 }],
      targetBall: 1,
      instructions: text.slice(0, 1500),
      goal
    },
    scoringRules: { mode: 'binary', attempts: 1, pass: { made: 1 } },
    xp: 0,
    skillEffects: { Safeties: 1 }
  };
}

let docsCache = null;
export function safetyDocs() {
  if (!docsCache) {
    docsCache = DRILLS.map(docFor);
    for (const d of docsCache) {
      const v = validatePooliq(JSON.stringify(d));
      if (!v.ok) throw new Error(`Safety Master ${d.id}: ${v.errors.join(' | ')}`);
    }
  }
  return docsCache;
}

let drillsCache = null;
export function safetyDrills() {
  if (!drillsCache) {
    drillsCache = safetyDocs().map((raw) => {
      const v = validatePooliq(JSON.stringify(raw));
      const ch = challengeFromPkfDoc(v.doc);
      delete ch.level;
      delete ch.speed;
      const meta = safetyMeta(ch.id);
      const imgs = safetyImages(ch.id);
      ch.safetyMaster = true;
      ch.xp = 0;
      ch.pq = { rankXpEligible: false };
      ch.prerequisites = [];
      ch.instructions = safetyText(ch.id);
      ch.layouts = [imgs.table];
      ch.tipImage = imgs.tip;
      ch.goal = `“${meta.quote}”`;
      return ch;
    });
  }
  return drillsCache;
}

function emptyCourse() { return { scores: {}, completed: null }; }

export function safetyOf(state) {
  const e = state?.safetyMaster;
  if (!e || typeof e !== 'object') return emptyCourse();
  return { scores: { ...(e.scores || {}) }, completed: e.completed || null };
}

/** Record one drill finished from the Safety Master course. Category play must not call this. */
export function withSafetyScore(state, id) {
  if (!isSafetyId(id)) return state;
  const e = safetyOf(state);
  if (!e.scores[id]) e.scores[id] = { score: 1, max: 1, at: new Date().toISOString() };
  const done = SAFETY_ORDER.every((k) => e.scores[k] && Number.isFinite(e.scores[k].score));
  if (done && !e.completed) {
    e.completed = {
      name: SAFETY_NAME,
      at: new Date().toISOString(),
      scores: SAFETY_ORDER.map((k) => ({ id: k, score: e.scores[k].score, max: e.scores[k].max }))
    };
  }
  return { ...state, safetyMaster: e };
}

export function safetyAccomplishmentHTML(state) {
  const e = safetyOf(state);
  if (!e.completed) return '';
  const n = e.completed.scores.length;
  return `<div class="card" data-safety-master="done"><div class="eyebrow">COURSE</div><h3>${SAFETY_NAME}</h3><p>Completed. ${n} / ${n}</p><p class="muted small">Every Safety Master drill, in order. Not a Billiard University exam.</p></div>`;
}

export function safetyBannerHTML() {
  return `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#safety" data-safety-entry="1"><span class="simPromoText"><span class="eyebrow">COURSE</span><b>${SAFETY_NAME}</b><small>${SAFETY_ORDER.length} drills in order. With the exams, not one of them. Also in each drill’s category. Not a Career rank.</small></span><span class="simPromoGo">›</span></button>`;
}

export function safetyPageHTML(state) {
  const e = safetyOf(state);
  const nDone = SAFETY_ORDER.filter((id) => e.scores[id]).length;
  let last = '';
  const rows = DRILLS.map((d, i) => {
    const key = d.heading + '\n' + d.quote;
    let head = '';
    if (key !== last) {
      last = key;
      head = `<h2 class="smSec">${esc(d.heading)}</h2><p class="muted smQuote">“${esc(d.quote)}”</p>`;
    }
    const sc = e.scores[d.id];
    return `${head}<button type="button" class="stageRow card" data-action="go" data-href="#play/drills/${d.id}/safety"><span class="srNum">${i + 1}</span><span class="srMain"><b>${esc(d.name)}</b><small>${esc(d.category)}${sc ? ' · done' : ''}</small></span></button>`;
  }).join('');
  const done = e.completed
    ? `<p class="green">Completed ${SAFETY_NAME}. It stays on your profile.</p>`
    : `<p class="muted">Finish all ${SAFETY_ORDER.length} in this list to record the accomplishment. Opening a drill is not enough. Playing one from its category does not finish the course. This does not change Career rank or Ball Pocketing level.</p><p class="muted small">${nDone} of ${SAFETY_ORDER.length} marked done in the course.</p>`;
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#drills">‹ Drills</button><span class="eyebrow">COURSE</span><h1>${SAFETY_NAME}</h1><p>Not a Billiard University exam. The drills run in this order. Each one is also in its shot category.</p></div>
    <div class="card">${done}<button type="button" class="bigBtn" data-action="go" data-href="#play/drills/${SAFETY_ORDER[0]}/safety">START AT THE FIRST DRILL</button></div>
    <div class="stageList" data-safety-list="1">${rows}</div>`;
}
