## **DevOps MCQ Assets**

**DevOps Certification Practice Quiz**
**by Yousaf Hamza**

This repository contains the core assets used by the **DevOps Certification Practice Quiz**, a professional, exam-grade MCQ platform designed for real **DevOps interview and certification preparation**.

The quiz is intentionally built using **static hosting + CDN**, without any backend, while still maintaining realistic exam behavior.

---

## **Repository Contents**

* **quiz.js**
  Main quiz engine logic (timer, navigation, scoring, anti-cheat, zoom control, UX behavior).

* **questions.json**
  A curated set of **200 professional DevOps MCQ questions** covering:

  * AWS
  * Kubernetes
  * Docker
  * Linux
  * CI/CD
  * Terraform
  * Git
  * Networking
  * Security
  * Monitoring

* **favicon.png**
  Favicon used by the quiz website.

* **beep.mp3**
  Audible warning sound played when 10 seconds remain for a question.

---

## **Quiz Behavior & Design**

This project follows **real certification exam principles** instead of casual quiz behavior.

Key characteristics:

* 2 minutes per question
* No auto-submit on timeout
* On timeout:

  * Options are disabled
  * “Next” is disabled
  * Only “Skip” is allowed
* Negative marking enabled
* Result shown **only after the final question**
* Exit leads to a Thank You page (no score leakage)

The goal is to closely simulate **AWS / Azure / Kubernetes certification exam UX**.

---

## **How These Assets Are Used**

The frontend quiz page (`index.html`) loads assets via **jsDelivr CDN** from this repository.

Example:

```
https://cdn.jsdelivr.net/gh/yousafkhamza/devops-mcq-assets@main/quiz.js
```

Inside `quiz.js`, questions are loaded from:

```
https://cdn.jsdelivr.net/gh/yousafkhamza/devops-mcq-assets@main/questions.json
```

This allows the quiz to run on **free static hosting platforms** (such as InfinityFree) without requiring any backend services.

---

## **CDN Caching & Updates (Important)**

jsDelivr uses aggressive global caching.
After pushing changes to GitHub, updates may **not reflect immediately** unless cache handling is done correctly.

---

## **Recommended Approach: Versioned URLs**

Always update asset URLs with a version parameter when making changes.

Example:

```
quiz.js?v=2026-01-15
questions.json?v=2026-01-15
```

This forces browsers and the CDN to fetch the latest version immediately and is the recommended production practice.

---

## **Manual Cache Purge (If Required)**

If you need to force-refresh jsDelivr cache manually:

1. Open the jsDelivr purge tool

   ```
   https://www.jsdelivr.com/tools/purge
   ```

2. Paste the asset URL you want to purge

   ```
   https://cdn.jsdelivr.net/gh/yousafkhamza/devops-mcq-assets@main/quiz.js
   ```

3. Click **Purge**

You can repeat the same process for `questions.json` if required.

---

## **Versioning Strategy**

Use a simple date-based versioning scheme:

```
YYYY-MM-DD
```

Update the version whenever:

* Quiz logic changes
* Questions are added or modified
* Bug fixes are applied

---

## **Important Notes**

* Answers in `questions.json` are correctly indexed **before shuffling**
* The quiz engine shuffles options at runtime and realigns answers safely
* Avoid using `raw.githubusercontent.com` for production assets
* Always bump the version after updates to avoid cache issues

---

## **Author**

**Yousaf Hamza**
Portfolio: [https://yousafhamza.dev](https://yousafhamza.dev)
LinkedIn: [https://www.linkedin.com/in/yousafhamza/](https://www.linkedin.com/in/yousafhamza/)

---

## **License**

This project is intended for **personal learning, interview preparation, and portfolio use**.
For commercial usage, please contact the author.
