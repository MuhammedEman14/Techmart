# Techmart
TechMart is a full-stack e-commerce analytics platform that provides real-time business intelligence, advanced customer behavior analytics, fraud detection, and inventory management. It leverages machine learning algorithms for customer segmentation, lifetime value prediction, churn detection, and personalized product recommendations

# Features
## Core Business Intelligence

Real-time Dashboard - Live sales metrics, transaction monitoring, and KPI tracking
Financial Analytics - Revenue tracking, profit margins, and financial forecasting
Sales Trends - Hourly, daily, weekly, and monthly sales analysis with interactive charts
Top Products Analysis - Best-selling products by revenue and quantity
Inventory Management - Low stock alerts with reorder recommendations and urgency levels
Custom Alerts - Configurable business alerts for critical events

## Advanced Customer Analytics (Challenge C)

RFM Customer Segmentation - Classify customers into 5 segments (Champions, Loyal, Potential, At Risk, Lost)
Customer Lifetime Value (CLV) Prediction - ML-powered revenue forecasting with confidence scores
Churn Risk Detection - 8-factor risk scoring with proactive retention alerts
Hybrid Recommendation Engine - Personalized product suggestions using collaborative filtering, affinity analysis, and segment-based algorithms
Personalized Dashboards - Segment-specific views and customer deep-dive analytics
A/B Testing Framework - Experiment management with statistical analysis and winner determination

## Security & Performance

Fraud Detection - Multi-factor risk scoring with 9 detection algorithms
Two-Tier Caching - Memory + Database caching for 100x performance improvement
Input Validation - Comprehensive request validation and SQL injection prevention
Scheduled Jobs - Automated daily analytics recalculation and cache management

## Prerequisites
Before you begin, ensure you have the following installed:
1. Node.js
2. Npm
3. MySQL
4. Docker (For containerized deployment)

## Installation
### Install Backend Dependencies
Go to your project root directory after downloading it and type:
cd backend
npm install
### Install Frontend Dependencies
cd ../frontend
npm install

### Setup MySQL Database
#### Using MySQL Workbench
Open MySQL Workbench
Create a new connection to your MySQL server (port must be 3306)
After that Run this:
CREATE DATABASE techmart_db

### Backend Configuration
Edit the .env file with your configuration:

Server Configuration

PORT=5000

NODE_ENV=development

CORS_ORIGIN=http://localhost:3000

Database Configuration

DB_HOST=localhost

DB_PORT=3306

DB_NAME=techmart_db

DB_USER=root

DB_PASSWORD=your_mysql_password

Business Rules

REORDER_THRESHOLD=10

MIN_TRANSACTION_AMOUNT=0.01

MAX_TRANSACTION_AMOUNT=10000

Analytics Configuration

RUN_INITIAL_ANALYTICS=true

CACHE_TTL_HOURS=24

### Frontend Configuration

Edit the .env file:

REACT_APP_API_URL=http://localhost:5000/api

### Run Database Migrations
npm run migrate

This creates all database tables with proper schema and relationships.
### Seed the Database
npm run seed

This imports the sample data from CSV files into your database.

### Calculate Initial Analytics
Run the endpoint /api/analytics/calculate-all for calculating analytics related to the challange, you can use swagger for this purpose

### Verify Setup
npm run verify

This script checks that all components are properly configured and ready to run.

then run 

npm start

in both frontend and backend folders to start

### Method 2: Docker Based Installation

### Start All Services
docker-compose up -d

This command will:

Build the Docker images

Start MySQL database

Start the backend API server

Start the frontend development server

### Initialize Database
Access the backend container

run:

docker-compose exec backend sh

Inside the container

run:

npm run generate-data

npm run migrate

npm run seed

Exit container

run:

exit

### Access the Application

Frontend: http://localhost:3000

Backend API: http://localhost:5000

API Health Check: http://localhost:5000/health


## Usage Examples

### 1. Viewing Dashboard Overview
Access the main dashboard at http://localhost:3000

What you'll see:

Total sales for the last 24 hours

Transaction count

Active customer count

Average order value

Sales trend chart

Top 5 products by revenue

Recent transactions feed

Low stock alerts


### 2. Analyzing Customer Behavior
Navigate to Analytics → Customer Analytics

Step-by-step:

Use the search box to find a customer (type name or email)

Select a customer from the autocomplete results

View comprehensive analytics:

RFM Segment Badge - Customer classification (Champions, Loyal, etc.)

RFM Score Breakdown - Recency (5), Frequency (4), Monetary (5) scores

CLV Prediction - Estimated lifetime value: $24,000 (95% confidence)

Churn Risk - Risk level: Medium (45/100) with specific indicators

Recommendations - 5 personalized product suggestions

Understanding RFM Scores:

Recency (1-5): How recently did they purchase?

5 = Within 7 days (Very Active)

1 = 180+ days (Lost Customer)

Frequency (1-5): How often do they purchase?

5 = 13+ transactions (Very Frequent)

1 = 1-2 transactions (Rare)

Monetary (1-5): How much do they spend?

5 = Top 20% spenders (High Value)

1 = Bottom 20% spenders (Low Value)


### 3. Running A/B Tests

Navigate to Analytics → A/B Tests

Creating a Test:

Click "Create New Test"

Fill in test details:

Test Name: "Recommendation Algorithm v2"

Test Type: "Recommendation"

Duration: 14 days

Variant A (Control): Current algorithm (40/30/30 weights)

Variant B (Experiment): New algorithm (50/25/25 weights)

Click "Start Test"

Monitoring Results:

View conversion rates per variant

Track revenue per variant

Monitor statistical significance

View lift percentage (B vs A)

Completing a Test:

After sufficient data (typically 100+ customers per variant):

Click "View Results"

Review metrics comparison

Check confidence level (aim for 95%+)

Implement winning variant if conclusive


### API Documentation

For detailed api documentation you can run Swagger

at http://localhost:5000/api-docs

