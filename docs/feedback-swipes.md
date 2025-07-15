# Discovery Swipe Feedback

Users can tune recommendations by swiping discovery cards. A swipe right records a positive signal while a swipe left records a negative one. Feedback is posted to `/api/v2/discovery/feedback` and queued in Redis for the learner.
