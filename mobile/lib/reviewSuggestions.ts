type StarBand = 1 | 2 | 3 | 4 | 5;

const SHOW_COUNT = 5;

type Pool = Record<StarBand, string[][]>;

const REVIEW_POOLS: Record<string, Pool> = {
  food: {
    1: [
      ['The food was not fresh and the order took too long. 🍽️', 'What arrived was stale, and we waited far too long. ⏳'],
      ['Staff were not attentive and the place felt unclean. 🧹', 'Nobody checked on us, and the tables did not look clean. 👀'],
      ['The bill did not match what we were told. 🧾', 'The final bill was higher than the prices we were shown. 💸'],
      ['Several dishes were cold by the time they reached us. ❄️', 'The meal arrived lukewarm and had clearly been sitting. 🥣'],
      ['I would not recommend this place after this visit. 👎', 'This meal was a letdown and I will not be back. 🚶'],
      ['The taste was off and the portions were tiny. 🥄', 'Nothing tasted right, and the serving was much too small. 📉'],
    ],
    2: [
      ['The taste was average and a few items arrived cold. 🍽️', 'Some dishes were fine, but others had gone cold. 😐'],
      ['Service was slow even though the place was not full. ⏱️', 'We waited a long time despite plenty of empty tables. 🪑'],
      ['Portions were smaller than expected for the price. 💸', 'The plate looked sparse for what they charged. 📏'],
      ['Staff were polite, but the order still came out wrong. 📝', 'They were nice, yet part of the order was missing. 😕'],
      ['The place was noisy and the table was not cleared. 🔊', 'It felt cramped, and used plates sat with us too long. 🧺'],
      ['I might try them again, but this visit disappointed me. 🔁', 'Not awful, just well below what I had hoped for. 📉'],
    ],
    3: [
      ['The food was okay, but nothing I would specially return for. 🍽️', 'It was an ordinary meal. Fine, not memorable. 😐'],
      ['Staff were polite, though the wait was longer than it should be. ⏱️', 'Service was friendly and just a bit too slow. 🙂'],
      ['Clean enough, but the meal felt ordinary. 🧹', 'The room was acceptable and the food was average. 🥄'],
      ['Prices were fair for a simple, nothing-special meal. 🧾', 'You get a basic plate for a reasonable bill. 💳'],
      ['A couple of dishes were good and the rest were plain. 🍛', 'One item stood out. The others were just alright. ✨'],
      ['An okay stop if you are nearby, not a place I would plan for. 📍', 'Convenient enough, though I would not go out of my way. 🚶'],
    ],
    4: [
      ['The food was fresh and most of the order was just right. 🍽️', 'Fresh plates, and almost everything tasted as it should. 😋'],
      ['Staff were polite and checked in at a good time. 👋', 'The team was warm and did not leave us waiting. 🙂'],
      ['Worth the money, with only a small wait. 💰', 'Good value. We were seated and served without much delay. ⏱️'],
      ['The place was clean and the portions were generous. ✨', 'Tidy tables and enough food on the plate. 🧹'],
      ['I would come back, especially for the dish I liked most. 🔁', 'Happy to return. One item in particular was excellent. ⭐'],
      ['Flavours were solid and they got the order right. 👌', 'Tasty food, and they served exactly what we asked for. 📝'],
    ],
    5: [
      ['The food was fresh and tasted just like we hoped. 😋', 'Every dish tasted fresh and lived up to the menu. 🍽️'],
      ['Staff seated us quickly and the place was clean. ✨', 'We were welcomed fast, and the tables were spotless. 🧹'],
      ['Generous portions, and I would recommend them. 👍', 'Plenty of food, and I would send friends here. 🙌'],
      ['Service stayed warm from the first hello to the bill. 😊', 'The team was kind the whole time we were there. 💛'],
      ['Great taste and a fair bill for what we got. 💰', 'Delicious meal, and the price felt completely fair. 🧾'],
      ['I am already planning the next visit. 🔁', 'This is now a place I want to come back to. ⭐'],
    ],
  },
  salon: {
    1: [
      ['The result did not match what I asked for. 💇', 'I left looking nothing like the style I described. 🪞'],
      ['The station did not feel clean and the visit felt rushed. 🧹', 'Tools and the chair did not look hygienic, and they hurried. ⚠️'],
      ['They started late and did not explain the charges. ⏱️', 'My slot slipped, and the bill was a surprise. 🧾'],
      ['The finish was uneven and I had to point it out. 👀', 'Patches were missed and nobody noticed until I did. 😕'],
      ['I would not recommend this visit. 👎', 'I left unhappy and would not book them again. 🚶'],
      ['They did not listen and kept doing their own thing. 🙉', 'I repeated what I wanted, and they still ignored it. 💬'],
    ],
    2: [
      ['The finish was uneven and needed a correction. 💇', 'It looked patchy, and I had to ask them to fix it. 🔧'],
      ['The booking was confusing and I waited past my slot. ⏱️', 'The appointment time was unclear and I sat waiting. 📅'],
      ['They were polite, but the work needed a redo. 🙂', 'Nice people, though the result was not usable as it was. 🪞'],
      ['The station could have been cleaner. 🧹', 'I was not fully comfortable with how the tools were kept. 🧴'],
      ['The price felt high for the result I got. 💸', 'I paid more than this finish was worth. 🧾'],
      ['I might give them one more try, but this was weak. 🔁', 'Disappointing visit. I expected much more care. 📉'],
    ],
    3: [
      ['The look was acceptable, though not what I had in mind. 💇', 'It was fine, just not the finish I had pictured. 🪞'],
      ['Hygiene was fine, but the appointment ran late. 🧹', 'The station was okay and my turn started late. ⏱️'],
      ['An okay visit. I would check the result more carefully next time. 👀', 'Acceptable work. I will be more specific next time. 📝'],
      ['Staff were polite and the result was ordinary. 🙂', 'They were pleasant, and the style was nothing special. 😐'],
      ['Fair enough for a quick trim, not for a big change. ✂️', 'Alright if you want something simple. 💇'],
      ['I left satisfied enough, with a few small misses. ✨', 'Mostly okay. A couple of details were skipped. 🔍'],
    ],
    4: [
      ['They listened, and the finish was close to what I wanted. 💇', 'They followed my request and the result was nearly spot on. 🪞'],
      ['The station was clean and they mostly stayed on time. 🧹', 'Hygienic setup, and the appointment was almost on time. ⏱️'],
      ['A good visit. A little more detail would make it better. ✨', 'Nice work. One extra pass would have made it perfect. 👌'],
      ['The team was calm and explained what they were doing. 💬', 'Relaxed experience, and they talked me through the steps. 🙂'],
      ['I would book them again for the same service. 🔁', 'Happy to return for this. ⭐'],
      ['The price matched the quality of the finish. 💰', 'Fair charge for a result I was pleased with. 🧾'],
    ],
    5: [
      ['They listened to what I wanted and the finish looked great. 💇', 'Exactly the look I asked for, and it turned out beautifully. ✨'],
      ['The station was hygienic and the experience felt calm. 🧹', 'Clean setup and a relaxed, professional visit. 😌'],
      ['Booking was easy and they started on time. 📅', 'The slot was simple to book and they began right on time. ⏱️'],
      ['I walked out happy and would recommend them. 👍', 'Loved the result and would send friends here. 🙌'],
      ['Skilled hands and a fair price. 💰', 'Excellent work, and the bill felt completely fair. 🧾'],
      ['This is my new regular place. ⭐', 'I already want to book the next visit. 🔁'],
    ],
  },
  health: {
    1: [
      ['I did not feel heard and the next steps were unclear. 🩺', 'My concerns were brushed aside and I left without a plan. 💬'],
      ['The wait was very long and the staff were dismissive. ⏱️', 'I waited a long time, then felt rushed out. 🚶'],
      ['The clinic did not feel clean and I left unsure. 🧹', 'Hygiene worried me, and nothing was explained properly. ⚠️'],
      ['The fee did not match the time or care I received. 💸', 'I was charged fully for a visit that felt careless. 🧾'],
      ['I would not recommend this visit. 👎', 'I am looking for another doctor after this. 🔍'],
      ['Questions were cut off before I could finish them. 🙉', 'I could not get a clear answer to a basic question. ❓'],
    ],
    2: [
      ['The consult felt rushed and only some questions were answered. 🩺', 'Too quick. Half of what I asked was left hanging. ⏱️'],
      ['The wait was much longer than the appointment time. ⏳', 'My slot passed and I was still in the waiting area. 🪑'],
      ['The care was basic and the explanation was hard to follow. 💬', 'I got a short answer that I still do not fully understand. 😕'],
      ['The clinic was average and the staff seemed distracted. 🧹', 'Nothing felt unsafe, but nobody seemed fully present. 👀'],
      ['I would think twice before booking again. 🔁', 'This visit did not give me much confidence. 📉'],
      ['The bill felt high for how little time I got. 💸', 'Short consult, and the charge still felt steep. 🧾'],
    ],
    3: [
      ['The doctor covered the basics, but the visit felt hurried. 🩺', 'The main point was covered, then the visit ended quickly. ⏱️'],
      ['Staff were fine, though the wait could be shorter. 🙂', 'Reception was okay. I just sat longer than I expected. 🪑'],
      ['An average visit. I got some answers, not all of them. 💬', 'Useful in parts, and a few questions stayed open. ❓'],
      ['The clinic was clean enough for a routine visit. 🧹', 'Hygiene was acceptable and the room was ordinary. 🏥'],
      ['Fine for a simple checkup, not if you need more time. 📋', 'Alright when the issue is straightforward. 👌'],
      ['I left with a basic idea of what to do next. 📝', 'I know the next step, even if the visit was plain. 🙂'],
    ],
    4: [
      ['The doctor listened and explained most of the next steps. 🩺', 'I was heard, and most of the plan was clear. 💬'],
      ['The wait was reasonable and the staff were kind. ⏱️', 'I was seen without a long delay, and the team was gentle. 🙂'],
      ['The clinic was clean. A bit more time would have helped. 🧹', 'Tidy clinic. I only wish the consult had been a little longer. ⏳'],
      ['I felt looked after and would book again if needed. 👍', 'A reassuring visit. I would return. 🔁'],
      ['The fee felt fair for the care I got. 💰', 'Reasonable charge for a proper explanation. 🧾'],
      ['My questions were answered in plain language. ✨', 'They explained it simply, which I appreciated. 📝'],
    ],
    5: [
      ['The doctor listened carefully and explained the next steps. 🩺', 'I felt heard, and the plan was explained clearly. 💬'],
      ['The wait was reasonable and the staff were kind. 💛', 'Short wait, and everyone I met was gentle. 🙂'],
      ['The clinic was clean and I felt looked after. ✨', 'Spotless clinic, and the care felt personal. 🏥'],
      ['I would recommend them to family. 👍', 'Trustworthy visit. I would send my family here. 🙌'],
      ['Clear advice and a fair fee. 💰', 'Honest guidance, and the bill matched the time I got. 🧾'],
      ['I left confident about what to do next. ⭐', 'I walked out knowing exactly what the next step is. 📝'],
    ],
  },
  education: {
    1: [
      ['The class felt unstructured and progress was hard to see. 📚', 'Lessons jumped around and I could not see any progress. 📉'],
      ['Questions were brushed off and parents were not updated. 💬', 'Doubts were ignored, and nobody updated us at home. 📵'],
      ['It did not feel worth the fee for the attention given. 💸', 'The fee is too high for how little attention we got. 🧾'],
      ['Classes were often cancelled without a proper notice. 📅', 'Sessions were missed and we heard about it too late. ⏱️'],
      ['I would not recommend this class. 👎', 'We are looking for another teacher after this. 🚶'],
      ['The basics were still weak after several classes. 📝', 'Core topics were not taught properly. 😕'],
    ],
    2: [
      ['Teaching was inconsistent and the basics stayed confusing. 📚', 'Some days were okay, but the basics never really settled. 😕'],
      ['Updates came late and the class often ran off schedule. ⏱️', 'We were rarely told what was covered, and timings slipped. 📅'],
      ['Some effort was there, but the learning still felt weak. 📝', 'They tried, yet the concepts did not stick. 📉'],
      ['Too many students, and my child rarely got a turn. 👥', 'The batch is crowded, so individual attention is rare. 👀'],
      ['I expected clearer homework and follow-up. 📋', 'Practice work was thin and nobody checked it. ✏️'],
      ['I am unsure about continuing here. 🔁', 'This term has been disappointing so far. 😐'],
    ],
    3: [
      ['The lessons were okay, but progress was slower than expected. 📚', 'Learning is happening, just more slowly than we hoped. 🐢'],
      ['Teachers were polite, though parent updates were thin. 🙂', 'The teacher is kind, and news from class is rare. 💬'],
      ['An average class. Useful on some days, ordinary on others. 📅', 'Hit and miss. A few sessions were genuinely helpful. ✨'],
      ['The fee is acceptable for a basic batch. 💰', 'You pay a fair amount for a standard class. 🧾'],
      ['Doubt clearing happens, but you have to ask more than once. ❓', 'Questions do get answered if you follow up. 🔁'],
      ['Fine if you already know the subject a little. 👌', 'Works better for revision than for learning from scratch. 📝'],
    ],
    4: [
      ['Teachers were patient and I could see some progress. 📚', 'Patient teaching, and the improvement is visible. 📈'],
      ['Parents got updates and the class was mostly on time. 💬', 'We hear how class went, and sessions usually start on time. ⏱️'],
      ['Good attention. A little more practice work would help. ✏️', 'Solid classes. Extra practice sheets would make them better. 📝'],
      ['Concepts were explained in a way that actually stuck. ✨', 'The explanations were clear and easy to revise later. 💡'],
      ['I would continue here for the next term. 🔁', 'Happy to stay on for the following batch. ⭐'],
      ['Fair fee for the attention given. 💰', 'The cost feels right for how closely they teach. 🧾'],
    ],
    5: [
      ['Teachers were patient and the progress was easy to see. 📚', 'Kind teachers, and the improvement showed up quickly. 📈'],
      ['Parents got clear updates and the class stayed disciplined. 💬', 'Regular updates at home, and the class is well run. 📅'],
      ['Good value for the attention given. 💰', 'Worth the fee because the attention is genuine. ⭐'],
      ['Doubts were welcomed and explained simply. 💡', 'No question felt too small, and the answers were clear. ❓'],
      ['I would recommend this class to other parents. 👍', 'A class I am glad to suggest to friends. 🙌'],
      ['Homework was useful and actually got checked. ✏️', 'Practice work mattered, and they reviewed it. 📝'],
    ],
  },
  property: {
    1: [
      ['The options did not match what was promised. 🏠', 'The listings were nothing like what I was told on the call. 🔑'],
      ['Follow-up was slow and the site visit felt rushed. ⏱️', 'I had to chase them, and the visit itself was hurried. 📞'],
      ['Charges and paperwork were not explained clearly. 📄', 'Fees and documents stayed confusing the whole time. 🧾'],
      ['I felt pushed toward a property I did not want. 🚫', 'The pitch was heavy, and my questions were skipped. 💬'],
      ['What they said on the call did not match the visit. 📍', 'Details kept changing, so it was hard to trust them. 🔍'],
      ['I would not recommend them after this experience. 👎', 'A poor experience. I am looking for someone else. 🚶'],
    ],
    2: [
      ['A few options were relevant, but most were not. 🏠', 'Only one or two listings were even close to my brief. 🔑'],
      ['We waited longer than told and the details kept changing. ⏱️', 'The visit ran late, and the facts shifted each time. 📞'],
      ['The visit happened, but the advice was hard to trust. 🔍', 'They did show a site, yet I could not rely on the details. 📍'],
      ['Paperwork and extra costs were mentioned too late. 📄', 'Hidden charges came up only after we had travelled. 💸'],
      ['I had to keep following up for basic updates. 📲', 'Replies were slow even for simple questions. ⏳'],
      ['Disappointing so far. I expected a clearer shortlist. 📉', 'Not the help I was looking for from a property advisor. 😕'],
    ],
    3: [
      ['Some properties fit, but the shortlist needed more work. 🏠', 'A few options were relevant. The rest needed filtering. 🔑'],
      ['The visit was organised, though updates were slow. 📍', 'The site visit itself was fine. Messages afterwards lagged. ⏱️'],
      ['An average experience. Helpful at times, unclear at others. 😐', 'Useful in parts, and vague when I asked for specifics. 💬'],
      ['They answered the main questions, not the smaller ones. ❓', 'Big points were covered. Details took more pushing. 📄'],
      ['Okay if you already know the area and just need options. 🗺️', 'Fine for a basic shortlist, not for careful advice. 👌'],
      ['No hard sell, but also not much guidance. 🚶', 'They were not pushy. I still had to decide mostly alone. 🤔'],
    ],
    4: [
      ['They showed options close to our budget and answered most questions. 🏠', 'The shortlist was near our budget, and most queries were cleared. 💬'],
      ['The site visit was organised. A quicker follow-up would help. 📍', 'Visit was well arranged. I only wish the next update came sooner. ⏱️'],
      ['Mostly honest about the area. I would consider them again. 👍', 'They were straight about the locality, so I would return. 🔁'],
      ['Paperwork was explained without pressure. 📄', 'Documents were walked through, and nobody pushed a decision. 🔑'],
      ['Local knowledge was good and the options were relevant. 🗺️', 'They knew the area, and the listings actually fit. ✨'],
      ['A solid experience with only small delays. ⭐', 'Helpful overall. The only gap was a slightly slow reply. 📞'],
    ],
    5: [
      ['They showed options that matched our budget without pressure. 🏠', 'Every option fit the budget, and nobody forced a decision. 🔑'],
      ['The site visit was organised and the paperwork was explained well. 📍', 'The visit ran smoothly, and the documents were clear. 📄'],
      ['Honest about timelines, and I would recommend them. 👍', 'Straight about how long things take. Happy to recommend. 🙌'],
      ['They knew the locality and answered the hard questions. 🗺️', 'Strong local knowledge, including the questions I was worried about. 💬'],
      ['Follow-up was quick from the first call to the visit. 📞', 'Replies stayed fast, which made the search much easier. ⏱️'],
      ['I felt looked after and would use them again. ⭐', 'A trustworthy advisor. I would come back for the next search. 🔁'],
    ],
  },
  auto: {
    1: [
      ['The fault came back and the quote did not match the bill. 🚗', 'The problem returned, and the bill was not the quote. 💸'],
      ['Extra work was added without asking me first. 🔧', 'They did extra jobs I never approved. 🚫'],
      ['The vehicle was not ready when they said it would be. ⏱️', 'I was told a time, then the vehicle was still unfinished. 📅'],
      ['The workshop was careless and nobody explained the fault. 🛠️', 'Messy job, and I still do not know what was wrong. 💬'],
      ['I would not trust them with the vehicle again. 👎', 'I am taking the vehicle somewhere else after this. 🚶'],
      ['Parts were not shown, so I could not verify the work. 🔍', 'They would not show what was replaced. 📦'],
    ],
    2: [
      ['The repair was incomplete and I had to go back. 🔧', 'It was not fully fixed, so I had to return. 🔁'],
      ['The quote changed after the work had started. 💸', 'The price moved once the vehicle was already in. 🧾'],
      ['The workshop was messy and the update came late. 🛠️', 'Untidy bay, and I had to call for a status. 📞'],
      ['They were polite, but the fault is only partly gone. 🙂', 'Nice staff, yet the issue is still there in a smaller way. 😕'],
      ['Pickup was later than promised. ⏱️', 'I waited past the time they gave me. ⏳'],
      ['I expected a clearer explanation of the work. 💬', 'The job happened, but nobody really walked me through it. 📝'],
    ],
    3: [
      ['The issue was partly fixed, but not as cleanly as I expected. 🚗', 'It runs better, though the repair is not as neat as I hoped. 🔧'],
      ['The price was acceptable, though the timing slipped. 💰', 'Fair enough on cost. The vehicle was just late. ⏱️'],
      ['An okay job. I would ask for a clearer estimate next time. 🧾', 'Acceptable work. Next time I will pin the quote first. 📝'],
      ['They found the main fault and missed a smaller one. 🔍', 'The big issue is sorted. A small one is still open. 🛠️'],
      ['Workshop was average and the staff were fine. 🙂', 'Ordinary garage, and the people were polite. 🛠️'],
      ['Fine for a basic service, not for a tricky fault. 👌', 'Alright if the job is simple. 🚗'],
    ],
    4: [
      ['They found the issue and did not push much extra work. 🔧', 'Correct diagnosis, without a list of extras I did not need. 👍'],
      ['The quote was fair and the vehicle was nearly on time. 💰', 'Honest price, and it was ready close to the promised hour. ⏱️'],
      ['They showed the replaced part. A faster update would help. 📦', 'I got to see the old part. A quicker call would be better. 📞'],
      ['The workshop was organised and the staff explained the job. 🛠️', 'Tidy place, and they told me what they had done. 💬'],
      ['I would bring the vehicle back for the next service. 🔁', 'Happy to return for regular servicing. ⭐'],
      ['Pickup was smooth and the ride felt right afterwards. 🚗', 'Easy handover, and the vehicle felt sorted on the way home. ✨'],
    ],
    5: [
      ['They found the issue quickly and did not push extra work. 🔧', 'Fast diagnosis, and no unnecessary add-ons. 👍'],
      ['The quote was fair and the vehicle was ready when promised. 💰', 'The bill matched the quote, and it was ready on time. ⏱️'],
      ['The workshop was organised and they showed the replaced parts. 🛠️', 'Clean workshop, and I saw exactly what was changed. 📦'],
      ['Clear updates from drop-off to pickup. 📞', 'They kept me posted until the vehicle was ready. 💬'],
      ['I would recommend this garage. 🙌', 'A workshop I trust and would suggest to others. ⭐'],
      ['Honest work and the vehicle feels right again. 🚗', 'Straightforward repair, and the problem is actually gone. ✨'],
    ],
  },
  repair: {
    1: [
      ['They arrived very late and the problem was still there. 🔧', 'The visit was hours late, and the fault remains. ⏱️'],
      ['The charge was higher than what was agreed. 💸', 'I was billed more than the price we had fixed. 🧾'],
      ['The work was left unfinished and the place was not cleaned. 🧹', 'They stopped halfway and left a mess behind. 🚫'],
      ['Nobody explained what had failed. 💬', 'I still do not know the cause after paying for the visit. ❓'],
      ['I had to call another person for the same job. 📞', 'This visit did not fix it, so I hired someone else. 🔁'],
      ['I would not recommend this service. 👎', 'A poor visit. I will not call them again. 🚶'],
    ],
    2: [
      ['The visit took longer than promised and the fix did not last. ⏱️', 'They overran the time, and the problem came back. 🔧'],
      ['They were polite, but the fault was only partly explained. 🙂', 'Kind enough, yet I only half understood the issue. 💬'],
      ['I had to call again for the same issue. 📞', 'One visit was not enough. The fault returned. 🔁'],
      ['The work area was left untidy. 🧹', 'The job ended, but the mess was mine to clear. 🧺'],
      ['The price crept up once they started. 💸', 'Extra charges appeared in the middle of the job. 🧾'],
      ['Disappointing for a straightforward repair. 📉', 'I expected a simple fix and did not get one. 😕'],
    ],
    3: [
      ['The job was done, though not as neatly as I hoped. 🔧', 'It works, but the finish is rougher than I wanted. 🛠️'],
      ['The timing slipped, but the main fault was addressed. ⏱️', 'They were late, and the core problem is sorted. 👌'],
      ['An average visit. Fine for a small job, not a bigger one. 📏', 'Okay for something minor. I would not book a large job. 🤔'],
      ['They explained a little and charged about what I expected. 💰', 'Short explanation, and the bill was roughly as quoted. 🧾'],
      ['Polite team, ordinary workmanship. 🙂', 'Nice people and a plain, acceptable repair. 🔧'],
      ['I might call them again for a small fault. 🔁', 'Usable for a minor issue. 📞'],
    ],
    4: [
      ['They reached close to time and finished the job neatly. ⏱️', 'Almost on time, and the work looked tidy. ✨'],
      ['The fault was explained and the charge matched the work. 💬', 'I understood the problem, and the bill matched it. 💰'],
      ['They tested it before leaving. A little faster would be better. 🔧', 'They checked the result. I only wish they had arrived sooner. 📞'],
      ['The place was cleaned up after the job. 🧹', 'They did not leave a mess behind. 👍'],
      ['I would call them again for a similar repair. 🔁', 'Reliable enough that I would book them next time. ⭐'],
      ['No surprise charges at the end. 🧾', 'The quote held, which I appreciated. ✨'],
    ],
    5: [
      ['They reached on time and finished the job neatly. ⏱️', 'On time, and the finished work looks clean. ✨'],
      ['They explained the fault and charged only for what was needed. 💬', 'Clear reason for the fault, and no extra items on the bill. 💰'],
      ['They cleaned up after the work and tested everything. 🧹', 'Mess cleared, and they tested it before leaving. 🔧'],
      ['Quick visit and a fix that has stayed fixed. 👍', 'In and out efficiently, and the problem has not returned. ⭐'],
      ['I would recommend them for home repairs. 🙌', 'A technician I am happy to suggest. 📞'],
      ['Polite, skilled, and fair on the price. 😊', 'Good manners, good work, and a fair bill. 🧾'],
    ],
  },
  stay: {
    1: [
      ['The room did not match the photos and check-in was difficult. 🛏️', 'The room looked nothing like the pictures, and check-in was a hassle. 📸'],
      ['Cleanliness was poor and the staff did not help. 🧹', 'The room was not clean, and nobody came to sort it. 🚫'],
      ['The price did not match what we received. 💸', 'We paid for a better stay than the one we got. 🧾'],
      ['Basic things were missing and complaints were ignored. 🎧', 'Essentials were not in the room, and our complaint went nowhere. 😕'],
      ['I would not recommend this stay. 👎', 'A bad night. I will not book here again. 🚶'],
      ['Check-in took too long and the room was not ready. ⏱️', 'We waited, and the room still was not prepared. 🔑'],
    ],
    2: [
      ['The room was below what was promised and the stay felt uncomfortable. 🛏️', 'Not the room we booked, and the night was uncomfortable. 😕'],
      ['Check-in was slow and a few basics were missing. ⏱️', 'Check-in dragged, and small essentials were not there. 🧴'],
      ['Staff responded, but the issues were not fully fixed. 📞', 'They did reply, yet the problems were only partly solved. 🔧'],
      ['Cleanliness needed more attention. 🧹', 'The room was usable, but not as clean as it should be. 👀'],
      ['The bill had extras we were not told about. 💸', 'Charges appeared that nobody mentioned at booking. 🧾'],
      ['I expected a smoother stay than this. 📉', 'Disappointing for the price we paid. 😐'],
    ],
    3: [
      ['The stay was acceptable, but the room needed better upkeep. 🛏️', 'Fine for a night, though the room could be better kept. 🧹'],
      ['Staff were polite, though the response time was uneven. 🙂', 'The team was kind, and help sometimes came late. ⏱️'],
      ['An average stay. I would check the room again before rebooking. 🔍', 'Ordinary stay. I would look at the room first next time. 📸'],
      ['Location was convenient and the room was plain. 📍', 'Easy to reach, and the room itself was nothing special. 🛏️'],
      ['Check-in worked, with a short wait. 🔑', 'We got in without much trouble. 👌'],
      ['Fair if you only need a simple night. 💰', 'Alright when you are not expecting anything fancy. 😐'],
    ],
    4: [
      ['The room was clean and check-in was mostly smooth. 🛏️', 'Clean room, and check-in was nearly effortless. 🔑'],
      ['Staff helped when we asked. A few small things could be better. 🙂', 'They helped on request. A couple of details were missing. ✨'],
      ['Fair for the price, and I would consider staying again. 💰', 'Good value. I would book them for another short stay. 🔁'],
      ['The bed was comfortable and the room was quiet enough. 😌', 'Slept well, and the room was not noisy. 🛏️'],
      ['Location made the stay easy. 📍', 'A handy location, which helped the whole trip. 🗺️'],
      ['A pleasant stay with only minor gaps. ⭐', 'Enjoyed it. Nothing major went wrong. 👍'],
    ],
    5: [
      ['The room matched what was promised and check-in was smooth. 🛏️', 'The room was exactly as shown, and check-in was easy. 🔑'],
      ['The place was clean and the staff were helpful. ✨', 'Spotless room, and the team actually helped. 🧹'],
      ['Fair price, and I would recommend the stay. 💰', 'Worth the money, and I would suggest it to others. 🙌'],
      ['Quiet, comfortable, and easy to reach. 😌', 'Slept well, and the location was convenient. 📍'],
      ['Every small request was handled politely. 😊', 'Staff stayed kind from arrival to checkout. 💛'],
      ['I would book this stay again. ⭐', 'Already thinking about the next visit. 🔁'],
    ],
  },
  general: {
    1: [
      ['They did not deliver what was agreed. 📉', 'The result was not what we had agreed on. 🚫'],
      ['Updates were missing and the work felt careless. 📵', 'Nobody kept us posted, and the work looked rushed. ⏱️'],
      ['I would not recommend them based on this experience. 👎', 'I cannot suggest them after the way this went. 🚶'],
      ['The price did not match the quality we received. 💸', 'We paid for a standard the work never reached. 🧾'],
      ['I had to follow up myself for every small step. 📞', 'Nothing moved unless I chased it. 🔁'],
      ['Basic points from our first conversation were ignored. 🙉', 'They forgot what we had clearly asked for. 💬'],
    ],
    2: [
      ['Part of the work was done, but not to the standard we discussed. 📝', 'Some of it was finished, below the level we set. 📉'],
      ['Communication was slow and I had to follow up myself. 📞', 'Replies took too long, so I kept checking in. ⏱️'],
      ['The result needed corrections before it was usable. 🔧', 'I could not use it until several things were fixed. 🛠️'],
      ['They were polite, yet the job still missed the brief. 🙂', 'Nice to deal with, but the work was off the mark. 😕'],
      ['Timelines slipped more than once. 📅', 'The date moved, and then it moved again. ⏳'],
      ['I expected a smoother experience than this. 😐', 'Disappointing for what should have been a simple job. 📉'],
    ],
    3: [
      ['The work was acceptable, but nothing stood out. 👌', 'It got done. There was nothing special about it. 😐'],
      ['They were polite, though the finish could be more careful. 🙂', 'Pleasant people, and the final detail was a bit rough. 🔍'],
      ['An average experience. Clear only if you already know what to ask. 💬', 'Fine when you spell out every step yourself. 📝'],
      ['The price was reasonable for an ordinary result. 💰', 'You pay a fair amount and get a standard job. 🧾'],
      ['Updates came when I asked, not before. 📞', 'I heard from them once I checked in. 📲'],
      ['Usable outcome, with a few small misses. ✨', 'Mostly there. A couple of points were skipped. 📋'],
    ],
    4: [
      ['They understood the job and delivered most of it well. 👍', 'They got the brief, and most of the work was strong. ✨'],
      ['Communication was clear, with only a small delay. 💬', 'Kept me posted. One update was just a little late. ⏱️'],
      ['I would use them again for a similar job. 🔁', 'Happy to call them for the next one. ⭐'],
      ['The finish was neat and the price felt fair. 💰', 'Tidy result, and the bill matched the work. 🧾'],
      ['They were professional from the first reply. 🙂', 'Polite and organised right from the start. 🤝'],
      ['Only a small detail was left for me to flag. 🔍', 'Almost complete. I pointed out one minor thing. 📝'],
    ],
    5: [
      ['They understood what I needed and delivered without fuss. 👍', 'They got it right the first time, with no drama. ✨'],
      ['Professional from the first call to the last update. 📞', 'Sharp and polite all the way through. 💬'],
      ['Quality work, and I would recommend them. 🙌', 'Excellent result. I would happily suggest them. ⭐'],
      ['Fair price for work I am genuinely happy with. 💰', 'The bill felt right for the quality I received. 🧾'],
      ['Updates were clear and always on time. ⏱️', 'I always knew where things stood. 📝'],
      ['I would come back the next time I need this. 🔁', 'This is who I will call again. 💛'],
    ],
  },
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mix32(value: number): number {
  let n = value >>> 0;
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
  n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
  return (n ^ (n >>> 16)) >>> 0;
}

function mixSuggestions(groups: string[][], seed: string): string[] {
  const key = hashString(seed.trim() || 'guest');
  const lines = groups.map((options, index) => {
    const choices = options.filter((line) => line.trim().length > 0);
    const pick = mix32(key + Math.imul(index + 1, 0x9e3779b1));
    return choices[pick % choices.length];
  });
  return lines
    .map((line, index) => ({
      line,
      index,
      rank: mix32(key ^ Math.imul(index + 3, 0x85ebca6b)),
    }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .slice(0, SHOW_COUNT)
    .map((item) => item.line);
}

function reviewFamily(category: string): keyof typeof REVIEW_POOLS {
  const key = category.trim().toLowerCase();
  if (/restaur|food|cafe|sweet|bakery|dhaba|cater|mithai/.test(key)) return 'food';
  if (/salon|spa|beauty|groom|makeup|parlour|parlor|hair/.test(key)) return 'salon';
  if (/clinic|hospital|dentist|doctor|pharma|medical|health/.test(key)) return 'health';
  if (/school|tutor|coach|educat|class/.test(key)) return 'education';
  if (/real estate|property|interior|construct|architect/.test(key)) return 'property';
  if (/hotel|resort|pg|hostel|guest house|lodge|banquet|marriage hall/.test(key)) return 'stay';
  if (/auto|garage|car|bike|mechanic|cab|taxi/.test(key)) return 'auto';
  if (/electri|plumb|hvac|repair|ac\b/.test(key)) return 'repair';
  return 'general';
}

export function reviewTemplatesForCategory(category: string, rating = 0, seed = ''): string[] {
  const stars = Math.round(rating);
  if (stars < 1 || stars > 5) return [];
  const family = reviewFamily(category);
  return mixSuggestions(REVIEW_POOLS[family][stars as StarBand], `${seed}|${family}|${stars}`);
}
