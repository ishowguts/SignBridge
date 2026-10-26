# Literature Review

Six sources were reviewed: two on sign language recognition as a field, two on Indian Sign Language (ISL) specifically, one on the hand-tracking method this project uses, and one on interface design principles.
Every citation below was checked against the publisher, arXiv or the dataset record on 25 Oct 2026.

## Comparison of approaches, findings and limitations

| Ref | Paper | Approach | Key findings | Limitations | Relevance to SignBridge |
|---|---|---|---|---|---|
| [1] | Bragg et al. (2019), *Sign Language Recognition, Generation, and Translation: An Interdisciplinary Perspective*, ASSETS '19 | Report from a two-day workshop of computer-vision, linguistics, Deaf-culture and HCI experts; reviews the state of the art and sets out challenges | Recognition research is held back by small datasets, little involvement of Deaf people and too little attention to how the output reaches users; the paper ends with a call to action for interdisciplinary, user-centred work | A position paper: no new system or measured results; focuses mostly on ASL | Motivates designing the *interface* around users (confirmation, correction, uncertainty) instead of reporting accuracy only (research gap 1) |
| [2] | Adeyanju, Bello & Adegboye (2021), *Machine learning methods for sign language recognition: A critical review and analysis*, Intelligent Systems with Applications 12, 200056 | Bibliometric and technical review of 649 Scopus publications on vision-based sign language recognition | Vision-based methods with hand-crafted or learned features and ML classifiers dominate; "perfect intelligent systems for sign language recognition are still an open problem" | Only Scopus-indexed work; compares methods but not how users experience them | Shows that hand-feature extraction + a classifier is an accepted, lightweight approach for static signs |
| [3] | Sridhar, Ganesan, Kumar & Khapra (2020), *INCLUDE: A Large Scale Dataset for Indian Sign Language Recognition*, ACM Multimedia 2020 | 4,287 videos of 263 ISL word signs recorded by Deaf students; pose-keypoint features with deep models | Best model reaches 94.5% on INCLUDE-50 and 85.6% on all 263 words | Word signs need video and movement modelling; heavy for a browser; recorded in one school | Shows the next step after static fingerspelling; explains why this project limits itself to static A–Z and 1–9 signs (gap 3) |
| [4] | Velmathi G & Goyal (2023), *Indian Sign Language Recognition Using MediaPipe Holistic*, arXiv:2304.10256 | MediaPipe Holistic keypoints (hands, face, pose) with CNN and LSTM models | CNN works better for static ISL signs (letters), LSTM for gesture-based phrases | Preprint, not peer reviewed; no interface or user study reported | Supports the choice of MediaPipe keypoints for static ISL letters |
| [5] | Zhang et al. (2020), *MediaPipe Hands: On-device Real-time Hand Tracking*, arXiv:2006.10214 (CVPR 2020 Workshop on Computer Vision for AR/VR) | Two-stage pipeline: palm detector, then a hand landmark model that predicts 21 keypoints from a single RGB camera | Real-time on mobile GPUs with high prediction quality; runs on-device | Detection is harder with overlapping hands, motion blur and poor light | The landmark extractor used in both training (Python) and the browser (WebAssembly); on-device processing also answers the privacy concern |
| [6] | Shneiderman, Plaisant, Cohen, Jacobs, Elmqvist & Diakopoulos (2016), *Designing the User Interface: Strategies for Effective Human-Computer Interaction*, 6th ed., Pearson | Design principles, including the Eight Golden Rules of interface design | Consistency, shortcuts, informative feedback, closure, error prevention, easy reversal, user control and low memory load make interfaces easier and safer to use | Expert guidelines; must still be checked with real users | Used to design and review every screen (Section 12) |

## Insights
- **Recognition is not the whole problem.** Papers [2]–[4] judge success by accuracy. Paper [1] argues that systems fail users when the interface hides uncertainty or gives no way to correct mistakes.
- **Static vs. dynamic signs.** Static letters and numbers can be recognised from one frame of hand landmarks ([4], [5]). Word signs need video models and large datasets ([3]). With one semester and no GPU server, static ISL fingerspelling is a realistic scope that still helps with names, spelling and learning.
- **On-device is possible.** MediaPipe Hands [5] runs in real time on ordinary devices, so the camera feed never needs to leave the user's computer.
- **Accuracy figures are optimistic.** Datasets are recorded by few signers in controlled settings ([1], [3]), so accuracy on new users will be lower. The interface has to handle uncertainty openly (confidence, top-3, retry, correction).

## References
[1] D. Bragg, O. Koller, M. Bellard, L. Berke, P. Boudreault, A. Braffort, N. Caselli, M. Huenerfauth, H. Kacorri, T. Verhoef, C. Vogler and M. R. Morris, "Sign Language Recognition, Generation, and Translation: An Interdisciplinary Perspective," in *Proc. 21st Int. ACM SIGACCESS Conf. on Computers and Accessibility (ASSETS '19)*, 2019, pp. 16–31. doi:10.1145/3308561.3353774. arXiv:1908.08597.

[2] I. A. Adeyanju, O. O. Bello and M. A. Adegboye, "Machine learning methods for sign language recognition: A critical review and analysis," *Intelligent Systems with Applications*, vol. 12, 200056, 2021. doi:10.1016/j.iswa.2021.200056.

[3] A. Sridhar, R. G. Ganesan, P. Kumar and M. Khapra, "INCLUDE: A Large Scale Dataset for Indian Sign Language Recognition," in *Proc. 28th ACM Int. Conf. on Multimedia (MM '20)*, 2020. doi:10.1145/3394171.3413528. Dataset: zenodo.org/records/4010759.

[4] G. Velmathi and K. Goyal, "Indian Sign Language Recognition Using Mediapipe Holistic," arXiv:2304.10256, 2023.

[5] F. Zhang, V. Bazarevsky, A. Vakunov, A. Tkachenka, G. Sung, C.-L. Chang and M. Grundmann, "MediaPipe Hands: On-device Real-time Hand Tracking," arXiv:2006.10214, 2020.

[6] B. Shneiderman, C. Plaisant, M. Cohen, S. Jacobs, N. Elmqvist and N. Diakopoulos, *Designing the User Interface: Strategies for Effective Human-Computer Interaction*, 6th ed. Pearson, 2016.

[7] "Indian_sign_language_dataset" (Hemg), Hugging Face, 42,745 RGB images of 35 static ISL classes (1–9, A–Z), https://huggingface.co/datasets/Hemg/Indian_sign_language_dataset.
