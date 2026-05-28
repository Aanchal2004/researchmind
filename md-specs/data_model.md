# Data Model

## users
- id
- email
- name
- auth_provider
- plan
- created_at

## papers
- id
- title
- abstract
- authors_json
- doi
- source
- year
- url
- pdf_url
- citation_count

## search_queries
- id
- user_id
- query_text
- filters_json
- created_at

## search_results
- id
- query_id
- paper_id
- rank
- score
- explanation_json

## collections
- id
- user_id
- name
- description
- created_at

## alerts
- id
- user_id
- query_text
- frequency
- is_active
- last_run_at

## summaries
- paper_id
- summary_text
- claims_json
- generated_at
- expires_at
