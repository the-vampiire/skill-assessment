// tests if a frame is Simple (digits only)
const isSimpleFrame = frame => !isNaN(Number(frame));

// tests if a frame is a Spare
const isSpareFrame = frame => /\d\/(\d)?/.test(frame);

// tests if a frame is a Strike
const isStrikeFrame = frame => /X/.test(frame);

// reduces the value of a Simple frame
const scoreSimple = frame => frame.split('').map(digit => Number(digit)).reduce((sum, digit) => sum + digit, 0); 

// scores a Spare with optional bonus flag
// bonus is for the first 9 frames
const scoreSpare = (frames, index, bonus) => {
  const nextFrame = frames[index + 1];
  // if there is no bonus or following frame exit early with basic 10 value
  if (!bonus || !nextFrame) return 10;

  // if the next frame is either Simple or a Spare
  // sum with the spare = 10 and first throw of next frame = #
  if (isSimpleFrame(nextFrame) || isSpareFrame(nextFrame)) return 10 + Number(nextFrame[0]);

  // otherwise the next frame is a strike
  // sum with spare = 10 and strike = 10
  return 10 + 10;
}

// scores a Strike with optional bonus flag
// bonus is for the first 9 frames only
const scoreStrike = (frames, index, bonus) => {
  const nextFrame = frames[index + 1];

  // if there is no bonus (last frames) a strike is worth a basic 10 value
  // if at end of frames array then exit early with basic 10 value
  if (!bonus || !nextFrame) return 10;

  // a simple frame has TWO BALLS thrown for a sum total
  // this strike = 10, simple total = first throw + second throw
  if (isSimpleFrame(nextFrame)) return 10 + scoreSimple(nextFrame);

  // spares are TWO BALLS thrown for a total of 10
  // this strike = 10, spare total = 10
  if (isSpareFrame(nextFrame)) return 10 + 10;

  // strikes count as ONE BALL thrown
  // this strike = 10, nextFrame strike = 10, + whatever came from the next throw
  // if there are not 2 available indices before the last throws then
  if (isStrikeFrame(nextFrame)) {
    const secondNextFrame = frames[index + 2];
    // if there are not 2 frames remaining there can be no proceeding frame
    // exit early with: this strike = 10, next frame strike = 10
    if (!secondNextFrame) return 10 + 10;

    // if there is a second throw determine its value
    // if spare or simple calculate from FIRST THROW ONLY (1 remaining throw)
    const nextThrowAfterStrike = secondNextFrame[0];

    // if the next throw is not a strike
    // sum this strike = 10, next frame strike = 10, next throw = #
    if (nextThrowAfterStrike !== 'X') return 10 + 10 + Number(nextThrowAfterStrike);

    // if the next throw IS a strike
    // sum this strike = 10, next frame strike = 10, next throw after strike = 10
    return 10 + 10 + 10;
  }
}

// scores the current frame dependent on its type 
const scoreFrame = (frames, index, getsBonus) => {
  const frame = frames[index];
  
  if (isSimpleFrame(frame)) return scoreSimple(frame);
  if (isSpareFrame(frame)) return scoreSpare(frames, index, getsBonus);
  return scoreStrike(frames, index, getsBonus);
};

// splits the silly FrameFrameFrame string into something usable
const splitLastFrames = lastFrames => lastFrames.split(/(X|\d\/|[0-9]{2})/).filter(char => char !== "");

// scores a frame string according to the bowling rules
// that as of today I am now an expert in...
const bowlingScore = (framesString) => {
  const allFrames = framesString.split(' ');
  const firstNine = allFrames.slice(0, 9);
  const lastFrames = allFrames.slice(9)[0];
  const frames = [...firstNine, ...splitLastFrames(lastFrames)];

  // first nine frames get bonus: index < 9
  return frames.reduce((total, _, index) => total + scoreFrame(frames, index, index < 9), 0);
};