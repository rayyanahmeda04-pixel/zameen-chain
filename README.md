# 🏛️ ZameenChain (زمین چین)
### *Blockchain-Based Land Title Registry & Anti-Fraud Escrow System for Karachi Urban Real Estate*

---

## 📌 1. Karachi Ka Asal Masla (Problem Statement)
Karachi mein **Scheme 33, Gulshan-e-Maymar, KDA, aur Surjani Town** ke plots mein rozana arabon rupaye ke frauds hote hain:
1. **Aik Plot, Teen Maalik (Double Allotment):** Paper-based patwari aur file system ki wajah se aik hi plot number ki do ya teen fake files bana kar alag alag kharidaron ko bech di jaati hain.
2. **Qabza Mafia & Fake Stamp Papers:** Asal maalik bahir gaya hota hai aur peeche se jaali papers bana kar property transfer karwa li jaati hai.
3. **Adalat Ke Stay Orders Ki Chhupa-chhupi:** Plot par Sindh High Court ka stay order hota hai, magar buyer ko bina bataye bayana (advance) le liya jata hai.

---

## 💡 2. ZameenChain Kaise Solve Karta Hai? (Proposed Solution)

* **🚫 Mathematical Anti-Double Allotment:** Har plot ka unique KDA ID (e.g. `KDA-SCH33-SEC14A-P102`) smart contract mein register hota hai. Duplicate number enter hone par contract transaction foran reject kar deta hai.
* **🤝 Atomic Smart Escrow:** Buyer ke paise smart contract mein lock hote hain. Jab tak KDA Registrar legal documents verify karke digital stamp nahi lagata, tab tak na paise seller ko jaate hain aur na title transfer hota hai.
* **🚨 Court Stay-Order / Dispute Freezing:** Agar adalat kisi property par stay order jari kare, toh KDA Registrar 1-click se usey on-chain "Disputed" flag kar deta hai, jiske baad wo plot na sell ho sakta hai na transfer.
* **🔍 Public Anti-Fraud Portal:** Koi bhi aam shehri bina wallet ke sirf KDA Plot number daal kar live check kar sakta hai ke property clean hai ya disputed.

---

## 🛠️ 3. Technology Stack (100% Free & Open Source)
* **Blockchain Core:** Ethereum Virtual Machine (EVM)
* **Smart Contract:** Solidity (v0.8.24) with `viaIR` optimizer
* **Development Framework:** Hardhat 2 + Chai Matchers
* **Frontend Web App:** React 19 + Vite + Tailwind CSS + Lucide Icons
* **Web3 Library:** Ethers.js v6
* **Decentralized Storage:** IPFS / Pinata (Allotment sanad scans & deeds)

---

## 🚀 4. How to Run the Project (Step-by-Step)

### Step 1: Automated Tests Run Karein (Viva Proof)
Smart contract ke 10 unit test cases verify karne ke liye:
```bash
npx hardhat test
```
*(Saare 10 tests green pass honge: Double allotment rejection, escrow lock, registrar approval, dispute freeze).*

### Step 2: Local Blockchain Node Start Karein
Terminal #1 khol kar local blockchain node chalayein:
```bash
npx hardhat node
```
*(Yeh aapke computer par 20 free accounts create kar dega jinme 10,000 free ETH honge).*

### Step 3: Smart Contract Deploy & Seed Karein
Terminal #2 khol kar realistic Karachi data seed karein:
```bash
npm run deploy:local
```
*(Yeh Scheme 33, Gulshan-e-Iqbal, Clifton, aur Surjani Town ke 4 sample plots blockchain par register kar dega).*

### Step 4: Frontend UI Run Karein
Terminal #2 mein hi frontend chala dein:
```bash
npm run client
```
Browser mein `http://localhost:5173` khul jayega!

---

## 🎯 5. University Presentation & Viva Demo Guide

Presentation wale din examiners ke samnay yeh 4 steps karke dikhayein:

### Step A: Public Verification Demo (The "Aam Shehri" Test)
1. **Public Verification** tab par jayein.
2. Preset button par click karein: `Surjani Town (Stay Order Flagged)`.
3. Screen par foran **🚨 RED ALERT** aayega showing: *"Sindh High Court Stay Order #SHC-2026/412 - Unauthorized sale strictly blocked"*.
4. Phir aik fake ID daalein: `KDA-FAKE-9999` aur search karein ➔ **"COUNTERFEIT PLOT DETECTED"** alert aayega!

### Step B: Anti-Double Allotment Demo (Fraud Prevention)
1. Role Switcher se **"KDA Registrar"** select karein.
2. **KDA Registrar Portal** tab mein jayein.
3. Pehle se registered plot ID daalein: `KDA-SCH33-SEC14A-P102` aur Mint par click karein.
4. Smart contract foran reject kar dega: **"Duplicate plot detected! KDA Number already registered"**.

### Step C: Safe Escrow Purchase Flow (Atomic Swap)
1. Role Switcher se **"Hamza Sheikh (Verified Buyer)"** select karein.
2. **Plots Directory** mein jayein aur Scheme 33 ke plot par **"Deposit 1.5 ETH into Escrow"** click karein.
3. Status **"Escrow Active"** ho jayega aur paise smart contract mein mehfooz lock ho jayenge.
4. Ab Role Switcher se wapis **"KDA Registrar"** chunein aur Registrar Portal par jayein.
5. Pending Escrow ke neechay **"Approve Legal Transfer"** click karein.
6. Ownership foran buyer ke naam ho jayegi aur 1.5 ETH seller ke wallet mein credit ho jayenge!

### Step D: Digital Sanad & Audit Trail View
1. Kisi bhi plot ke **"Inspect Deed & Blockchain History"** par click karein.
2. Modal mein complete timeline nazar aayegi: *Genesis Allotment ➔ Verified Sale ➔ Timestamp ➔ IPFS Hash*.

---

## 🏆 Viva Questions & Model Answers

**Q1: Agar blockchain public hai toh kisi ki property ka private data leak nahi hoga?**
> *Answer:* Hum private identity (jaise CNIC ya phone number) blockchain par direct nahi rakhte. Blockchain par sirf cryptographic hash, KDA allotment number aur wallet address hota hai. Sensitive legal documents IPFS par encrypted store hote hain.

**Q2: Gas fees kon bharega?**
> *Answer:* Real estate mein registry fee hukumat pehle se leti hai (e.g. 2% stamp duty). Blockchain transaction ki gas fee us stamp duty ka minor fraction hoti hai jo automated smart contract deduct kar sakta hai. Testing ke liye hum local node aur Sepolia testnet use kar rahe hain jo 100% free hai.

**Q3: Agar court ka stay order aa jaye toh blockchain toh immutable hai, phir kya hoga?**
> *Answer:* Immutability ka matlab yeh nahi ke state update nahi ho sakti. ZameenChain smart contract mein `flagDispute()` function hai jo KDA / Adalat ko yeh ikhtiyar deta hai ke property ko freeze kar sakein taake koi usey fraud se aage na bech sake.
