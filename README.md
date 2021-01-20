# CryptoEvies

## Summary
CryptoEvies is a decentralized token-based, ERC721 compliant project which is made to incentivize students to complete a certain task. Inspired by my little sister, CryptoEvies currently only supports an efficiency task where homework is done within less than an hour and half. Further tasks and customizibility will be added.

CryptoEvies is a dual user platform where there is a **student** and a **supervisor**

- The student can register their address as a student and request a supervisor. Once the supervisor approves the student, the student can start attempting to complete their incentivized task. If the student completes the task, they are rewarded a **pending token**. Pending tokens are essentially tokens which will be awarded to students upon the supervisors approval of task completion.

- The supervisor must approve a student which requested them as a supervisor. The supervisor can then review pending tokens and approve them. Once pending tokens are approved, they are rewarded to the students

- **Evie Tokens** (approved pending tokens) can be exchanged for rewards with the supervisor

## Project intention
This project is supposed to be a fun way to introduce Middle/ High Schoolers to blockchain. It is also an overly convoluted (🤷, but fun) method of incentivization for my sister.  

## Technology
CryptoEvies currently uses Svelte and TypeScript for its frontend and Solidity/ Ethereum for the backend. Due to high gas prices, CryptoEvies will likely transition away from Ethereum to something more inexpensive like NEAR.

## Future considerations
In the future I would like to:
- Make Evie Tokens customizable and tradable (think CryptoKitties)
- Have custom tasks put forth by the supervisor
- Add integration with oracles which would connect to a Canvas or Google Classroom API.