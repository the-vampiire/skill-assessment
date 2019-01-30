const faceCardMap = {
  T: 10, // ten
  J: 11, // Jack
  Q: 12, // Queen
  K: 13, // King
  A: 14, // Ace
}

const reverseFaceCardMap = {
  10: 'T',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
};

const Result = {
  win: 1,
  tie: 3,
  loss: 2,
};

function PokerHand(hand) {
  this._hand = hand.split(' ');
  this.handStatus = {};
  this.winConditions = {};

  this._declareWin = function() { return Result.win; }
  this._declareLoss = function() { return Result.loss; }
  this._declareTie = function() { return Result.tie; }

  this.assessHand = function() {
    this._checkFlush();
    this._checkStraight();
    this._checkStraightFlush();
    // if a straight flush is found exit early
    if (this.handStatus.hasStraightFlush) return;
    
    this._checkFourOfAKind();
    // if four of a kind found exit early
    if (this.handStatus.hasFourOfAKind) return;

    // if three and pair: full house implicitly flagged
    this._checkThreeOfAKind();
    this._checkPair();
    
    // only check two pair if a first pair is found
    if (this.handStatus.hasPair) this._checkTwoPair();
  }
  
  /**
   * extracts the high card from a given hand
   * 
   * converts face cards to numeric value for comparison
   * 
   * defaults to this._hand if no arg given
   * @param {[string]} hand [optional] the hand to extract a high card from
   * @return {object} { card, value }
   */
  this.getHighCard = function(hand) {
    const cards = hand || this._hand;
    return cards.reduce(
      (highCard, currentCard) => {
        const [rawValue] = currentCard; // 0: value, 1: suit
        // convert face card values if applicable
        const cardValue = faceCardMap[rawValue] || Number(rawValue);

        const isGreater = cardValue > highCard.value;
        const card = isGreater ? currentCard : highCard.card;
        const value = isGreater ? cardValue : highCard.value;

        return { card, value };
      },
      { card: null, value: 0 });
  }
  
  /**
   * utility to retrieve the handStatus result for a given status
   * @param {PokerHand} hand their hand instance
   * @param {string} status the handStatus to retrieve
   * @return {object} { theyHave: bool, weHave: bool }
   */
  this._getStatuses = function(hand, status) {
    return {
      theyHave: hand.handStatus[status],
      weHave: this.handStatus[status],
    };
  }

  /**
   * utility to retrive the winCondition value for a given winCondition
   * @param {PokerHand} hand their hand instance
   * @param {string} winCondition the winCondition value to retrieve
   * @return {object} { theirHighest, ourHighest }
   */
  this._getHighestWinCondition = function(hand, winCondition) {
    return {
      theirHighest: hand.winConditions[winCondition],
      ourHighest: this.winConditions[winCondition],
    };
  }

  /**
   * generic utility for comparing any status between our and their hand
   * @param {PokerHand} hand their hand instance
   * @param {object} options the comparison options
   * @param {string} options.status the handStatus to compare
   * @param {string} winCondition [optional] the winCondition to use for default tiebreaking behavior
   * @param {function} tieBreaker [optional] a custom tie breaking function for more complex behavior
   * @returns {null} null: in event of winCondition tie or no winCondition
   * @returns {Result} Result: when a win or loss is determined
   */
  this._compareCondition = function(hand, { status, winCondition, tieBreaker }) {
    const { theyHave, weHave } = this._getStatuses(hand, status);

    if (theyHave) {
      // if they have it and we dont we lose
      if (!weHave) return this._declareLoss();
      
      // custom tie breaker method when we and they have it
      // anonymous tieBreaker passed as arg is unbound: use call
      if (tieBreaker) return tieBreaker.call(this, hand);

      // simple winCondition tie breaker approach
      if (winCondition) {
        const { theirHighest, ourHighest } = this._getHighestWinCondition(hand, winCondition);
        if (theirHighest > ourHighest) return this._declareLoss();
        if (theirHighest < ourHighest) return this._declareWin();
      }
    }
    // if they dont have it but we do we win
    else if (weHave) return this._declareWin();
    
    return null; // resort to default high card tie breaker
  }

  /**
   * analyzes this._hand for the presence of a flush (all cards same suit)
   * 
   * if a flush is found sets flags:
   * - handStatus.hasFlush: true
   * - winConditions.flush: the flush suit
   */
  this._checkFlush = function() {
    const suitToCheck = this._hand[0][1];
    const hasFlush = this._hand.every(([value, suit]) => suit === suitToCheck);
    if (hasFlush) {
      this.handStatus.hasFlush = true;
      this.winConditions.flush = suitToCheck;
    }
  }

  /**
   * analyzes this._hand for the presence of a straight (all successive card values)
   * 
   * if a straight is found sets flags:
   * - handStatus.hasStraight: true
   * - winCondition.straight: [string] ascending order cards in straight
   */
  this._checkStraight = function() {
    // get card values
    const values = this._hand.map(([rawValue]) => {
      const value = faceCardMap[rawValue] || rawValue;
      return Number(value);
    });

    // sort straight in order ascending
    values.sort((valA, valB) => valA - valB);
    // check that each subsequent card is the successive value
    let lastValue = values[0];
    for(const value of values.slice(1)) {
      const nextExpectedValue = lastValue + 1;
      // if it is not successive exit early
      if (value !== nextExpectedValue) return;
      lastValue = value;
    }
    // all cards in successive order flag straight
    this.handStatus.hasStraight = true;
    this.winConditions.straight = values;
  }

  /**
   * analyzes this.handStatus for the presence of a straight and flush
   * 
   * if a straight flush is determined sets flag:
   * - handStatus.hasStraightFlush: true
   */
  this._checkStraightFlush = function() {
    if (this.handStatus.hasFlush && this.handStatus.hasStraight) {
      this.handStatus.hasStraightFlush = true;
    }
  }
  
  /**
   * utility for counting 2-4 duplicate card values
   * @param {[string]} cards the cards to analyze for duplicates
   * @returns {object} { card: Number, count: Number }
   */
  this._countDuplicates = function(cards) {
    const highestFrequency = (cardFrequency) => {
      // map to shape: [card value, frequency count]
      const entries = Object.keys(cardFrequency).map(key => [key, cardFrequency[key]]);
      // sort by frequency descending
      entries.sort((entryA, entryB) => entryB[1] - entryA[1]);
      const [card, count] = entries[0]; // get highest frequency
      return { card: Number(card), count };
    }

    return cards.reduce((cardFrequency, [rawValue], index, hand) => {
        const value = faceCardMap[rawValue] || Number(rawValue);

        if (cardFrequency[value]) ++cardFrequency[value];
        else cardFrequency[value] = 1;

        // on last iteration reduce frequencies to highest count only
        if (index === hand.length - 1) return highestFrequency(cardFrequency);
        return cardFrequency;
      },
      {}); 
  }

  /**
   * analyzes this._hand for the presence of four of a kind
   * 
   * if four of a kind is determined sets flags:
   * - handStatus.hasFourOfAKind: true
   * - winConditions.fourOfAKind: numeric card value
   */
  this._checkFourOfAKind = function() {
    const { card, count } = this._countDuplicates(this._hand);
    if (count === 4) {
      this.handStatus.hasFourOfAKind = true;
      this.winConditions.fourOfAKind = card;
    }
  }

  /**
   * analyzes this._hand for the presence of three of a kind
   * 
   * if three of a kind is determined sets flags:
   * - handStatus.hasThreeOfAKind: true
   * - winConditions.threeOfAKind: numeric card value
   */
  this._checkThreeOfAKind = function() {
    const { card, count } = this._countDuplicates(this._hand);
    if (count === 3) {
      this.handStatus.hasThreeOfAKind = true;
      this.winConditions.threeOfAKind = card;
    }
  }

  /**
   * analyzes this._hand for the presence of a pair
   * 
   * if a pair is determined sets flags:
   * - handStatus.hasPair: true
   * - winConditions.pair: numeric card value
   * 
   * if three of a kind flag is set and a pair is found also sets:
   * - handStatus.hasFullHouse: true
   */
  this._checkPair = function() {
    // if three of a kind has already been found
    // filter card set to find potential pair
    const hasThreeOfAKind = this.handStatus.hasThreeOfAKind;
    const cards = hasThreeOfAKind
      ? this._hand.filter(([rawValue]) => {
          const value = faceCardMap[rawValue] || Number(rawValue);
          return value !== this.winConditions.threeOfAKind;
        })
      : this._hand; // no three of a kind found use original hand

    const { card, count } = this._countDuplicates(cards);
    if (count === 2) {
      this.handStatus.hasPair = true;
      this.winConditions.pair = card;

      // if a pair and three of a kind are found flag Full House
      if (hasThreeOfAKind) this.handStatus.hasFullHouse = true;
    }
  }

  /**
   * analyzes this._hand for the presence of two pairs
   * - only called if handStatus.hasPair is true
   * 
   * if two pair are found sets flags:
   * - handStatus.hasTwoPair: true
   * - winConditions.twoPair: descending order array of numeric card pair values 
   */
  this._checkTwoPair = function() {
    const currentPair = this.winConditions.pair;

    const pairRemoved = this._hand.filter(([rawValue]) => {
      const value = faceCardMap[rawValue] || Number(rawValue);
      return value !== currentPair;
    });

    const { card, count } = this._countDuplicates(pairRemoved);
    if (count === 2) {
      this.handStatus.hasTwoPair = true;
      const pairs = [currentPair, card];
      // sort in desc order for tiebreaking
      pairs.sort((cardA, cardB) => cardB - cardA);
      this.winConditions.twoPair = pairs;
    }
  }

  /**
   * custom tiebreaker for pair comparison
   * - compares the higher of the two pairs
   * 
   * @param {PokerHand} hand their hand instance
   * @returns {null} null: the pairs are tied
   * @returns {Result} Result: if a win or loss is determined
   */
  this._pairTieBreaker = function(hand) {
    const { theirHighest, ourHighest } = this._getHighestWinCondition(hand, 'pair');

    // compare pair
    if (theirHighest > ourHighest) return this._declareLoss();
    if (theirHighest < ourHighest) return this._declareWin();
    
    return null;
  }

  /**
   * custom tiebreaker for two pair comparison
   * - compares the higher of the two pair pairs
   * - compares the lower of the two pair pairs
   * 
   * @param {PokerHand} hand their hand instance
   * @returns {null} null: both the pairs are tied
   * @returns {Result} Result: if a win or loss is determined
   */
  this._twoPairTieBreaker = function(hand) {
    const { theirHighest, ourHighest } = this._getHighestWinCondition(hand, 'twoPair');
    const [theirFirst, theirSecond] = theirHighest;
    const [ourFirst, ourSecond] = ourHighest;

    // compare highest pairs
    if (theirFirst > ourFirst) return this._declareLoss();
    if (theirFirst < ourFirst) return this._declareWin();
    
    if (theirFirst === ourFirst) {
      // tie on highest pairs compare second highest pairs
      if (theirSecond > ourSecond) return this._declareLoss();
      if (theirSecond < ourSecond) return this._declareWin();
    }

    return null;
  }

  /**
   * utility for recursively comparing high cards until a winner is determined
   * @returns {Result} Result: win, loss, or tie (if every single card matches)
   */
  this._compareHighCards = function(hand) {
    const filterHighCard = (cards, highCard) => {
      const cardsClone = cards.slice(); // clone to prevent mutation of arg
      const highCardIndex = cardsClone.findIndex(card => card === highCard.card);
      cardsClone.splice(highCardIndex, 1);

      return cardsClone;
    };

    const recursiveCompare = (theirCards, ourCards) => {
      // no more cards to compare: complete tie
      if (theirCards.length === 0 && ourCards.length === 0) return null;

      const theirHighest = hand.getHighCard(theirCards);
      const ourHighest = this.getHighCard(ourCards);

      // their highest beats ours: we lose
      if (theirHighest.value > ourHighest.value) return false;
      // our highest beats theirs: we win
      if (theirHighest.value < ourHighest.value) return true;

      // remove the last highest card checked and recurse
      const theirRemaining = filterHighCard(theirCards, theirHighest);
      const ourRemaining = filterHighCard(ourCards, ourHighest);

      return recursiveCompare(theirRemaining, ourRemaining);
    }

    const result = recursiveCompare(hand._hand, this._hand);
  
    if (result === true) return this._declareWin();
    if (result === false) return this._declareLoss();
    return this._declareTie();
  } 
}

/**
 * core method for comparing one hand instance against another
 * - iterates over the comparisons from highest to least importance until a winner is determined
 * - if none of the core comparisons result in a winner defaults to high card comparison
 * 
 * @param {PokerHand} hand their hand instance
 * @returns {Result} Result: win, loss, or tie (if every single card matches)
 */
PokerHand.prototype.compareWith = function(hand) {
  // assess the results of each hand
  this.assessHand();
  hand.assessHand();

  const comparisons = [
    { status: 'hasStraightFlush' },
    { status: 'hasFourOfAKind', winCondition: 'fourOfAKind' },
    { status: 'hasFullHouse', winCondition: 'threeOfAKind' },
    { status: 'hasFlush' },
    { status: 'hasStraight' },
    { status: 'hasThreeOfAKind', winCondition: 'threeOfAKind' },
    { status: 'hasTwoPair', tieBreaker: this._twoPairTieBreaker },
    { status: 'hasPair', tieBreaker: this._pairTieBreaker },
  ];

  for(const comparisonRules of comparisons) {
    const result = this._compareCondition(hand, comparisonRules);
    if (result !== null) return result;
  }
  return this._compareHighCards(hand);
}

module.exports = PokerHand;