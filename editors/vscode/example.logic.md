---
spec_version: 1.0
name: "Customer Support Triage Agent"
description: "An AI agent that triages customer support tickets based on severity and category"
reasoning: cot

global:
  timeout: 60
  allowed_tools:
    - search_knowledge_base
    - check_customer_history
    - send_notification
  denied_tools:
    - execute_refund

imports:
  - source: "./shared-steps.logic.md"
    alias: shared
  - source: "./escalation-rules.logic.md"
    items:
      - escalate_to_specialist
      - check_priority

steps:
  - id: extract_ticket_info
    instructions: "Parse the support ticket to extract customer info, issue category, and urgency indicators"
    needs:
      - ticket_content
    output_schema:
      type: object
      properties:
        customer_id:
          type: string
        category:
          type: string
          enum: [billing, technical, account, general, urgent]
        severity:
          type: number
          minimum: 1
          maximum: 5
        issue_summary:
          type: string
    verification:
      - condition: "{{ $output.customer_id && $output.category && $output.severity }}"
        message: "Must extract all required ticket fields"
    timeout: 10
    retry:
      max_attempts: 2
      delay: 1000
      backoff: exponential
      backoff_factor: 2

  - id: check_knowledge_base
    instructions: "Search the knowledge base for solutions matching the issue category and keywords"
    needs:
      - ticket_info
    allowed_tools:
      - search_knowledge_base
    output_schema:
      type: object
      properties:
        found_solution:
          type: boolean
        article_id:
          type: string
        confidence:
          type: number
    branches:
      - condition: "{{ $output.found_solution == true && $output.confidence > 0.8 }}"
        target: send_solution
      - condition: "{{ $output.found_solution == true && $output.confidence <= 0.8 }}"
        target: escalate_to_human
      - target: analyze_issue_complexity

  - id: analyze_issue_complexity
    instructions: "Analyze the issue depth and determine if it requires specialist knowledge"
    needs:
      - ticket_info
    output_schema:
      type: object
      properties:
        complexity_level:
          type: string
          enum: [simple, moderate, complex]
        estimated_resolution_time:
          type: number
        requires_specialist:
          type: boolean
    verification:
      - condition: "{{ $output.complexity_level }}"
        message: "Must determine complexity level"

  - id: send_solution
    instructions: "Send the knowledge base solution to the customer with personalization"
    needs:
      - customer_info
      - knowledge_article
    allowed_tools:
      - send_notification
    output_schema:
      type: object
      properties:
        sent_successfully:
          type: boolean
        timestamp:
          type: string
        ticket_status:
          type: string
          enum: [resolved, pending_feedback, needs_followup]

  - id: escalate_to_human
    instructions: "Create a ticket assignment for a human support agent"
    needs:
      - ticket_info
      - analysis_results
    allowed_tools:
      - assign_to_queue
    output_schema:
      type: object
      properties:
        assigned_to:
          type: string
        queue_position:
          type: number
        estimated_response_time:
          type: number

contracts:
  - id: ticket_format_contract
    description: "Validates that incoming tickets have required structure"
    input_schema:
      type: object
      properties:
        ticket_id:
          type: string
        customer_email:
          type: string
          format: email
        subject:
          type: string
        body:
          type: string
        created_at:
          type: string
          format: date-time
      required:
        - ticket_id
        - customer_email
        - subject
        - body
    preconditions:
      - "{{ $input.ticket_id }}"
      - "{{ $input.customer_email.includes('@') }}"
    postconditions:
      - "{{ $output.processing_status == 'accepted' }}"
    error_handling:
      on_fail: skip
    sla:
      max_wait_time: 300
      max_processing_time: 60
    severity: error

  - id: response_quality_contract
    description: "Ensures responses meet quality standards"
    output_schema:
      type: object
      properties:
        response_text:
          type: string
          minLength: 50
        helpfulness_score:
          type: number
          minimum: 0
          maximum: 1
        sentiment:
          type: string
          enum: [positive, neutral, negative]
    postconditions:
      - "{{ $output.helpfulness_score > 0.7 }}"
      - "{{ $output.sentiment != 'negative' }}"
    error_handling:
      on_fail: revise
    severity: warning

quality_gates:
  - metric: resolution_rate
    threshold: 0.85
    on_fail: escalate
    severity: error
    message: "First-contact resolution must exceed 85%"

  - metric: average_response_time
    threshold: 300
    on_fail: abort
    severity: error
    message: "Average response time must be under 5 minutes"

  - metric: customer_satisfaction
    threshold: 4.0
    on_fail: revise
    severity: warning
    message: "Customer satisfaction score must be at least 4.0/5.0"

  - metric: knowledge_base_coverage
    threshold: 0.7
    on_fail: skip
    severity: info
    message: "Knowledge base should cover 70% of common issues"

decision_trees:
  - id: routing_decision
    description: "Decide routing based on severity and complexity"
    condition: "{{ $step.ticket_info.severity > 4 || $step.analysis_results.requires_specialist }}"
    then_step: escalate_to_human
    else_step: send_solution
    default_step: escalate_to_human

  - id: followup_decision
    description: "Determine if customer followup is needed"
    condition: "{{ $step.send_solution.ticket_status == 'pending_feedback' }}"
    then_step: schedule_followup
    else_step: close_ticket

fallback:
  step: escalate_to_human
  message: "Escalating to human support due to workflow interruption"
  decision_tree:
    - condition: "{{ $error.code == 'timeout' }}"
      action: "send_timeout_notification"
    - condition: "{{ $error.code == 'validation_failed' }}"
      action: "request_ticket_clarification"
    - condition: "{{ $error.code == 'tool_unavailable' }}"
      action: "use_backup_escalation"
    - action: "send_to_default_queue"

---

# Customer Support Triage Agent

## Overview

This LOGIC.md specification defines an intelligent customer support ticket triage system. The agent analyzes incoming support tickets, searches the knowledge base for solutions, and intelligently routes complex issues to human specialists.

## Key Features

- **Intelligent Categorization**: Automatically extracts ticket information and categorizes issues
- **Knowledge Base Integration**: Searches for existing solutions before escalation
- **Complexity Analysis**: Assesses issue complexity to determine required expertise level
- **Quality Control**: Enforces SLA metrics and response quality standards
- **Graceful Fallback**: Escalates to human support when issues exceed automation capacity
- **Audit Trail**: Tracks all decisions and routing actions

## Reasoning Strategy

The agent uses **Chain-of-Thought (cot)** reasoning to:

1. Break down the problem systematically
2. Analyze each aspect independently
3. Make informed routing decisions
4. Provide explanations for actions taken

## Process Flow

```
1. Extract Ticket Information
   ↓
2. Search Knowledge Base
   ├─ Solution Found (High Confidence) → Send Solution
   ├─ Solution Found (Low Confidence) → Escalate to Human
   └─ No Solution Found → Analyze Complexity
                          ↓
                          [Branch Decision]
                          ├─ Simple Issue → Send Solution
                          └─ Complex Issue → Escalate to Human
```

## Step Definitions

### Extract Ticket Info

Parses incoming support tickets to identify:
- **Customer ID**: Unique customer identifier
- **Category**: Issue type (billing, technical, account, general, urgent)
- **Severity**: 1-5 scale indicating urgency
- **Summary**: Concise issue description

Includes retry logic (up to 2 attempts) with exponential backoff.

### Check Knowledge Base

Searches internal documentation for matching solutions. Returns:
- **Found Solution**: Boolean indicating if a match exists
- **Article ID**: Reference to knowledge base article
- **Confidence**: Match confidence score (0-1)

Routes based on confidence threshold:
- High confidence (>0.8) → Send solution directly
- Low confidence (≤0.8) → Human review needed
- No match → Complexity analysis

### Analyze Issue Complexity

Evaluates issue depth to classify as:
- **Simple**: Routine issues resolvable by automation
- **Moderate**: May require knowledge-base article + human verification
- **Complex**: Needs specialist expertise

Estimates resolution time and specialist requirements.

### Send Solution

Delivers the knowledge base solution to the customer with:
- Personalized greeting
- Relevant article content
- Follow-up options
- Status tracking

### Escalate to Human

Creates assignment for human support agent:
- Routes to appropriate queue based on specialty
- Provides estimated response time
- Sets customer expectations

## Quality Metrics

All metrics are enforced via quality gates:

| Metric | Threshold | Failure Action |
|--------|-----------|-----------------|
| Resolution Rate | 85% | Escalate |
| Response Time | 5 min | Abort |
| Customer Satisfaction | 4.0/5.0 | Revise |
| KB Coverage | 70% | Skip |

## Contracts

### Ticket Format Contract
Enforces that incoming tickets contain required information with valid formats.

**Preconditions:**
- Ticket ID must be present
- Customer email must be valid

**Postconditions:**
- Ticket must be accepted for processing

**SLA:**
- Wait time: < 5 minutes
- Processing time: < 1 minute

### Response Quality Contract
Ensures all customer responses meet quality standards.

**Requirements:**
- Minimum 50 characters
- Helpfulness score > 0.7
- Sentiment must not be negative

## Fallback Behavior

If the main workflow fails, the agent escalates to human support with context-aware actions:

- **Timeout**: Send customer notification and escalate
- **Validation Error**: Request ticket clarification from customer
- **Tool Unavailable**: Use backup escalation mechanism
- **Default**: Route to default support queue

## Reasoning Examples

### Example 1: Simple, High-Confidence Solution
```
Input: "How do I reset my password?"
→ Extract: category=account, severity=2
→ KB Search: Found "Password Reset Guide" (confidence=0.95)
→ Route: Send Solution
→ Output: Customer receives password reset instructions
→ Status: Resolved
```

### Example 2: Complex Issue Requiring Escalation
```
Input: "Custom API integration failing with error code 500"
→ Extract: category=technical, severity=5
→ KB Search: Found related article (confidence=0.6)
→ Decision: Complexity=complex, requires_specialist=true
→ Route: Escalate to Human
→ Output: Assigned to Senior Technical Support
```

## Tool Requirements

The agent requires access to:

- **search_knowledge_base**: Query internal documentation
- **check_customer_history**: Retrieve customer account information
- **send_notification**: Communicate with customers

Tools explicitly denied:
- **execute_refund**: No authority to process refunds automatically

## Extensibility

This specification can be extended with:

- Additional decision trees for specific issue types
- Integration with CRM systems for customer context
- Machine learning models for confidence scoring
- Multi-language support via translation tools
- Custom escalation rules by region or account tier

---

## Testing

Test files for this specification should cover:

1. **Happy Path**: Ticket with KB solution
2. **Escalation Path**: Complex issue requiring human intervention
3. **Error Handling**: Network failures, timeout scenarios
4. **Edge Cases**: Malformed input, boundary conditions

## Support

For questions about this specification, contact the support engineering team.
