#!/usr/bin/env python3
"""
Flask API Server for Real-time Updates
Handles notifications, streaks, and background tasks
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from services import (
    DatabaseConnection, NotificationService, StreakService,
    BadgeService, XPService, LeaderboardService
)
import json

app = Flask(__name__)
CORS(app)

# Initialize database connection
db_conn = DatabaseConnection()

# Initialize services
notifications_service = NotificationService(db_conn)
streaks_service = StreakService(db_conn)
badges_service = BadgeService(db_conn)
xp_service = XPService(db_conn)
leaderboard_service = LeaderboardService(db_conn)


@app.route('/api/notifications/<int:user_id>', methods=['GET'])
def get_notifications(user_id):
    """Get user notifications"""
    limit = request.args.get('limit', 10, type=int)
    result = notifications_service.get_user_notifications(user_id, limit)
    return jsonify(result)


@app.route('/api/notifications/<int:notification_id>/read', methods=['POST'])
def mark_notification_read(notification_id):
    """Mark notification as read"""
    result = notifications_service.mark_as_read(notification_id)
    return jsonify(result)


@app.route('/api/notifications', methods=['POST'])
def create_notification():
    """Create a new notification"""
    data = request.get_json()
    result = notifications_service.create_notification(
        data.get('user_id'),
        data.get('message'),
        data.get('notification_type')
    )
    return jsonify(result)


@app.route('/api/streak/<int:user_id>', methods=['POST'])
def update_streak(user_id):
    """Update user streak"""
    result = streaks_service.update_daily_streak(user_id)
    return jsonify(result)


@app.route('/api/streak/<int:user_id>/calendar', methods=['GET'])
def get_streak_calendar(user_id):
    """Get streak calendar"""
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    result = streaks_service.get_streak_calendar(user_id, month, year)
    return jsonify(result)


@app.route('/api/badges/<int:user_id>', methods=['GET'])
def get_badges(user_id):
    """Get user badges"""
    result = badges_service.get_user_badges(user_id)
    return jsonify(result)


@app.route('/api/badges/<int:user_id>/check', methods=['POST'])
def check_badges(user_id):
    """Check and unlock new badges"""
    result = badges_service.check_and_unlock_badges(user_id)
    return jsonify(result)


@app.route('/api/xp/calculate', methods=['POST'])
def calculate_xp():
    """Calculate bonus XP"""
    data = request.get_json()
    result = xp_service.calculate_bonus_xp(
        data.get('user_id'),
        data.get('base_xp'),
        data.get('bonus_type', 'daily_multiplier')
    )
    return jsonify(result)


@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get leaderboard"""
    limit = request.args.get('limit', 10, type=int)
    result = leaderboard_service.get_top_users(limit)
    return jsonify(result)


@app.route('/api/leaderboard/update', methods=['POST'])
def update_leaderboard():
    """Manually update leaderboard"""
    result = leaderboard_service.update_leaderboard()
    return jsonify(result)


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'SkillSprint Background Service'})


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(host='localhost', port=5000, debug=True)
