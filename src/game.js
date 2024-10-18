function game() {
    return {
        deckId: '',
        playerHand: [],
        dealerHand: [],
        playerTotal: 0,
        dealerTotal: 0,
        message: '',
        gameOver: false,

        async init() {
            await this.newGame();
        },

        async newGame() {
            const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
            const data = await response.json();
            this.deckId = data.deck_id;
            this.playerHand = [];
            this.dealerHand = [];
            this.playerTotal = 0;
            this.dealerTotal = 0;
            this.message = '';
            this.gameOver = false;

            await this.dealInitialCards();
        },

        async dealInitialCards() {
            await this.dealCard(this.dealerHand, true);
            await this.dealCard(this.playerHand);
            await this.dealCard(this.dealerHand, false);
            await this.dealCard(this.playerHand);
            this.updateTotals();
        },

        async dealCard(hand, isVisible = true) {
            const response = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/draw/?count=1`);
            const data = await response.json();
            const card = data.cards[0];
            hand.push({...this.formatCard(card), isVisible});

            this.$nextTick(() => {
                const newCard = hand === this.playerHand ? document.querySelector('#player-hand .card:last-child') : document.querySelector('#dealer-hand .card:last-child');
                anime({
                    targets: newCard,
                    scale: [0, 1],
                    rotate: '1turn',
                    duration: 1000,
                    easing: 'easeOutElastic(1, .8)'
                });
            });
        },

        formatCard(card) {
            const suit = card.suit === 'HEARTS' ? '♥' : card.suit === 'DIAMONDS' ? '♦' : card.suit === 'CLUBS' ? '♣' : '♠';
            return { value: card.value, suit: suit, code: card.code, image: card.image };
        },

        updateTotals() {
            this.playerTotal = this.calculateTotal(this.playerHand);
            this.dealerTotal = this.calculateTotal(this.dealerHand.filter(card => card.isVisible));
        },

        calculateTotal(hand) {
            let total = 0;
            let aces = 0;
            for (let card of hand) {
                if (card.value === 'ACE') {
                    aces += 1;
                } else if (['KING', 'QUEEN', 'JACK'].includes(card.value)) {
                    total += 10;
                } else {
                    total += parseInt(card.value);
                }
            }
            for (let i = 0; i < aces; i++) {
                if (total + 11 <= 21) {
                    total += 11;
                } else {
                    total += 1;
                }
            }
            return total;
        },

        async hit() {
            await this.dealCard(this.playerHand);
            this.updateTotals();
            if (this.playerTotal > 21) {
                this.message = 'バスト！ディーラーの勝ちです。';
                this.gameOver = true;
            } else if (this.playerTotal === 21) {
                await this.stand();
            }
        },

        async stand() {
            this.dealerHand[1].isVisible = true;
            this.updateTotals();
            while (this.dealerTotal < 17) {
                await this.dealCard(this.dealerHand);
                this.updateTotals();
            }
            this.determineWinner();
        },

        determineWinner() {
            if (this.dealerTotal > 21) {
                this.message = 'ディーラーがバスト！あなたの勝ちです！';
            } else if (this.playerTotal > this.dealerTotal) {
                this.message = 'あなたの勝ちです！';
            } else if (this.playerTotal < this.dealerTotal) {
                this.message = 'ディーラーの勝ちです。';
            } else {
                this.message = '引き分けです。';
            }
            this.gameOver = true;
        },

        showRules() {
            document.getElementById('rules').style.display = 'block';
        },

        hideRules() {
            document.getElementById('rules').style.display = 'none';
        }
    }
}

