/**
 * Rule-Based Note Analysis Utility
 * Analyzes clinical notes for risk keywords, sentiment, and incident indicators
 * NO AI API REQUIRED - Completely free!
 */

const RISK_KEYWORDS = {
  safety: {
    keywords: [
      'fall', 'fell', 'falling', 'injury', 'injured', 'accident', 'hurt', 'hurting',
      'bleeding', 'blood', 'bruise', 'bruised', 'wound', 'broken', 'fracture',
      'burn', 'burned', 'cut', 'choke', 'choking', 'emergency', 'urgent'
    ],
    severity: 'high',
    category: 'Safety Risk'
  },
  behavioral: {
    keywords: [
      'aggression', 'aggressive', 'violent', 'violence', 'hit', 'hitting', 'punch',
      'punching', 'kick', 'kicking', 'bite', 'biting', 'throw', 'throwing', 'threw',
      'angry', 'rage', 'outburst', 'tantrum', 'screaming', 'yelling', 'property damage',
      'destructive', 'destroy', 'absconding', 'absconded', 'eloped', 'wandered', 'runaway'
    ],
    severity: 'high',
    category: 'Behavioral Concern'
  },
  medical: {
    keywords: [
      'seizure', 'seizures', 'medication missed', 'medication error', 'wrong medication',
      'overdose', 'allergic reaction', 'allergic', 'breathing difficulty', 'cant breathe',
      'chest pain', 'unconscious', 'unresponsive', 'hospital', 'ambulance', '000', '911',
      'emergency room', 'er', 'doctor', 'medical emergency', 'vomit', 'vomiting', 'fever'
    ],
    severity: 'critical',
    category: 'Medical Emergency'
  },
  psychological: {
    keywords: [
      'self-harm', 'self harm', 'suicidal', 'suicide', 'cutting', 'depression',
      'depressed', 'anxiety attack', 'panic', 'panicking', 'distress', 'distressed',
      'crying', 'upset', 'withdrawn', 'isolated', 'refuses to eat', 'not eating'
    ],
    severity: 'high',
    category: 'Psychological Concern'
  },
  compliance: {
    keywords: [
      'refusal', 'refused', 'refuses', 'non-compliant', 'declined', 'resist',
      'resisting', 'uncooperative', 'restraint', 'physical intervention',
      'forced', 'forcing', 'wont cooperate', 'will not'
    ],
    severity: 'medium',
    category: 'Compliance Issue'
  },
  abuse: {
    keywords: [
      'abuse', 'abused', 'neglect', 'neglected', 'mistreatment', 'mistreated',
      'inappropriate', 'assault', 'harassment', 'exploitation', 'exploited'
    ],
    severity: 'critical',
    category: 'Abuse Allegation'
  },
  positive: {
    keywords: [
      'happy', 'smiling', 'smiled', 'engaged', 'participated', 'cooperative',
      'enjoyed', 'success', 'successful', 'improvement', 'improved', 'progress',
      'progressing', 'calm', 'relaxed', 'positive', 'well', 'great', 'excellent',
      'wonderful', 'good', 'pleasant', 'friendly'
    ],
    severity: 'positive',
    category: 'Positive Indicator'
  }
};

/**
 * Analyze note content for risk keywords
 * @param {String} content - Note content to analyze
 * @returns {Object} Analysis results
 */
exports.analyzeNoteContent = (content) => {
  if (!content || typeof content !== 'string') {
    return {
      risk_detected: false,
      keywords_found: [],
      sentiment: 'Neutral',
      sentiment_reason: 'No content to analyze',
      incident_report_required: false
    };
  }

  const contentLower = content.toLowerCase();
  const results = {
    risk_detected: false,
    keywords_found: [],
    matched_categories: [],
    sentiment: 'Neutral',
    sentiment_reason: '',
    incident_report_required: false,
    severity_score: 0
  };

  // Scan for keywords in each category
  Object.entries(RISK_KEYWORDS).forEach(([categoryKey, data]) => {
    const matchedWords = data.keywords.filter(keyword => {
      // Use word boundary regex for exact word matching
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(content);
    });

    if (matchedWords.length > 0) {
      results.keywords_found.push(...matchedWords);

      // Only add category once even if multiple keywords matched
      if (!results.matched_categories.includes(data.category)) {
        results.matched_categories.push(data.category);
      }

      // Calculate severity score
      if (data.severity === 'critical') results.severity_score += 10;
      else if (data.severity === 'high') results.severity_score += 5;
      else if (data.severity === 'medium') results.severity_score += 2;
      else if (data.severity === 'positive') results.severity_score -= 2;
    }
  });

  // Remove duplicates
  results.keywords_found = [...new Set(results.keywords_found)];

  // Determine sentiment based on score
  if (results.severity_score >= 10) {
    results.sentiment = 'High Risk';
    results.sentiment_reason = `Critical keywords detected: ${results.matched_categories.join(', ')}`;
    results.risk_detected = true;
    results.incident_report_required = true;
  } else if (results.severity_score >= 5) {
    results.sentiment = 'Concerning';
    results.sentiment_reason = `Risk indicators found: ${results.matched_categories.join(', ')}`;
    results.risk_detected = true;
    results.incident_report_required = true;
  } else if (results.severity_score >= 2) {
    results.sentiment = 'Concerning';
    results.sentiment_reason = `Potential issues noted: ${results.matched_categories.join(', ')}`;
    results.risk_detected = true;
  } else if (results.severity_score < -2) {
    results.sentiment = 'Positive';
    results.sentiment_reason = 'Note indicates positive engagement and progress';
  } else {
    results.sentiment = 'Neutral';
    results.sentiment_reason = 'No significant risk indicators detected';
  }

  return results;
};

/**
 * Generate incident report from note content
 * @param {String} content - Note content
 * @param {Array} keywords - Detected keywords
 * @param {Array} categories - Matched categories
 * @returns {Object} Incident report structure
 */
exports.generateIncidentReport = (content, keywords, categories) => {
  // Extract sentences containing keywords for context
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const relevantSentences = sentences.filter(sentence =>
    keywords.some(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(sentence);
    })
  );

  // Determine incident type from categories
  const incidentType = categories[0] || 'General Incident';

  // Extract what happened (up to 300 chars of relevant content)
  const whatHappened = relevantSentences.length > 0
    ? relevantSentences.slice(0, 3).join('. ').substring(0, 300)
    : content.substring(0, 300);

  return {
    incident_type: incidentType,
    what_happened: whatHappened + (whatHappened.length >= 300 ? '...' : ''),
    why: 'Requires investigation and assessment by supervisor',
    action_taken: 'Documented in shift notes - refer to detailed note content for actions taken',
    controlled_how: 'See full note content for control measures and de-escalation strategies used',
    follow_up: 'Supervisor review required. Consider formal incident report if not already filed. Monitor for recurrence.'
  };
};

/**
 * Check if formal incident report exists for this note
 * @param {Object} note - Note object
 * @returns {Boolean} True if incident report exists
 */
exports.hasIncidentReport = (note) => {
  // Check if note category is 'Incident' or if it's linked to an incident
  return note.category === 'Incident' || note.incidentReportId != null;
};

/**
 * Extract key points from client notes for summary report
 * @param {Array} notes - Array of note objects
 * @returns {Object} Extracted key points organized by category
 */
exports.extractKeyPoints = (notes) => {
  const summary = {
    total_notes: notes.length,
    incidents: [],
    medication_issues: [],
    health_concerns: [],
    behavioral_observations: [],
    positive_progress: [],
    staff_involved: new Set(),
    date_range: {
      earliest: null,
      latest: null
    }
  };

  notes.forEach(note => {
    // Track staff
    if (note.staffId?.name) {
      summary.staff_involved.add(note.staffId.name);
    }

    // Track date range
    const noteDate = new Date(note.shiftDate || note.createdAt);
    if (!summary.date_range.earliest || noteDate < summary.date_range.earliest) {
      summary.date_range.earliest = noteDate;
    }
    if (!summary.date_range.latest || noteDate > summary.date_range.latest) {
      summary.date_range.latest = noteDate;
    }

    // Analyze note content
    const analysis = exports.analyzeNoteContent(note.content);

    // Extract sentences with keywords
    const sentences = note.content.split(/[.!?]+/).filter(s => s.trim().length > 10);

    // Categorize key points
    if (analysis.matched_categories.includes('Safety Risk') ||
        analysis.matched_categories.includes('Medical Emergency')) {
      const incidentSentences = sentences.filter(s =>
        analysis.keywords_found.some(kw => new RegExp(`\b${kw}\b`, 'i').test(s))
      );
      if (incidentSentences.length > 0) {
        summary.incidents.push({
          date: noteDate.toLocaleDateString(),
          description: incidentSentences.join('. ').substring(0, 200),
          keywords: analysis.keywords_found,
          severity: analysis.sentiment
        });
      }
    }

    if (analysis.matched_categories.includes('Medical Emergency')) {
      const medicalKeywords = ['medication', 'seizure', 'hospital', 'ambulance', 'doctor'];
      const medicalSentences = sentences.filter(s =>
        medicalKeywords.some(kw => s.toLowerCase().includes(kw))
      );
      if (medicalSentences.length > 0) {
        summary.health_concerns.push({
          date: noteDate.toLocaleDateString(),
          description: medicalSentences.join('. ').substring(0, 200)
        });
      }
    }

    if (analysis.matched_categories.includes('Behavioral Concern')) {
      const behavioralSentences = sentences.filter(s =>
        analysis.keywords_found.some(kw => new RegExp(`\b${kw}\b`, 'i').test(s))
      );
      if (behavioralSentences.length > 0) {
        summary.behavioral_observations.push({
          date: noteDate.toLocaleDateString(),
          description: behavioralSentences.join('. ').substring(0, 200)
        });
      }
    }

    if (analysis.sentiment === 'Positive') {
      const positiveSentences = sentences.filter(s =>
        analysis.keywords_found.some(kw => new RegExp(`\b${kw}\b`, 'i').test(s))
      );
      if (positiveSentences.length > 0) {
        summary.positive_progress.push({
          date: noteDate.toLocaleDateString(),
          description: positiveSentences.join('. ').substring(0, 150)
        });
      }
    }

    // Check for medication keywords
    const medicationKeywords = ['medication', 'medicine', 'dose', 'pill', 'tablet', 'prescription'];
    const medicationSentences = sentences.filter(s =>
      medicationKeywords.some(kw => s.toLowerCase().includes(kw))
    );
    if (medicationSentences.length > 0) {
      summary.medication_issues.push({
        date: noteDate.toLocaleDateString(),
        description: medicationSentences.join('. ').substring(0, 200)
      });
    }
  });

  // Convert Set to Array
  summary.staff_involved = Array.from(summary.staff_involved);

  return summary;
};
