#!/usr/bin/env python3
"""
SkillSprint Real-time Notifications Service
Handles notifications, streaks, XP calculations, and badge unlocks
"""

import mysql.connector
from mysql.connector import Error
import json
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

class DatabaseConnection:
    def __init__(self):
        try:
            self.conn = mysql.connector.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASS', ''),
                database=os.getenv('DB_NAME', 'skillsprint')
            )
            self.cursor = self.conn.cursor(dictionary=True)
        except Error as e:
            print(f"Error connecting to MySQL: {e}")
            self.conn = None

    def close(self):
        if self.conn and self.conn.is_connected():
            self.cursor.close()
            self.conn.close()


class NotificationService:
    def __init__(self, db_conn):
        self.db = db_conn

    def create_notification(self, user_id, message, notification_type):
        """Create a new notification for user"""
        try:
            self.db.cursor.execute(
                "INSERT INTO notifications (user_id, message, notification_type) VALUES (%s, %s, %s)",
                (user_id, message, notification_type)
            )
            self.db.conn.commit()
            return {"success": True, "message": "Notification created"}
        except Error as e:
            return {"success": False, "error": str(e)}

    def get_user_notifications(self, user_id, limit=10):
        """Get user notifications"""
        try:
            self.db.cursor.execute(
                """SELECT id, message, notification_type, is_read, created_at 
                FROM notifications WHERE user_id = %s 
                ORDER BY created_at DESC LIMIT %s""",
                (user_id, limit)
            )
            notifications = self.db.cursor.fetchall()
            return {"success": True, "notifications": notifications}
        except Error as e:
            return {"success": False, "error": str(e)}

    def mark_as_read(self, notification_id):
        """Mark notification as read"""
        try:
            self.db.cursor.execute(
                "UPDATE notifications SET is_read = TRUE WHERE id = %s",
                (notification_id,)
            )
            self.db.conn.commit()
            return {"success": True}
        except Error as e:
            return {"success": False, "error": str(e)}

    def send_level_up_notification(self, user_id):
        """Send level up notification"""
        self.create_notification(
            user_id,
            "🎉 Congratulations! You leveled up!",
            "level_up"
        )

    def send_streak_notification(self, user_id, streak_count):
        """Send streak milestone notification"""
        message = f"🔥 Amazing! You've maintained a {streak_count}-day streak!"
        self.create_notification(user_id, message, "streak_milestone")

    def send_badge_unlock_notification(self, user_id, badge_name):
        """Send badge unlock notification"""
        message = f"✨ New Badge Unlocked: {badge_name}"
        self.create_notification(user_id, message, "badge_unlock")


class StreakService:
    def __init__(self, db_conn):
        self.db = db_conn

    def update_daily_streak(self, user_id):
        """Update user's daily streak"""
        try:
            today = datetime.now().strftime('%Y-%m-%d')
            yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')

            # Check if already completed today
            self.db.cursor.execute(
                "SELECT COUNT(*) as count FROM streak_calendar WHERE user_id = %s AND date = %s",
                (user_id, today)
            )
            result = self.db.cursor.fetchone()

            if result['count'] == 0:
                # Add today to streak
                self.db.cursor.execute(
                    "INSERT INTO streak_calendar (user_id, date, completed_challenge) VALUES (%s, %s, TRUE)",
                    (user_id, today)
                )

                # Check if streak continues
                self.db.cursor.execute(
                    "SELECT COUNT(*) as count FROM streak_calendar WHERE user_id = %s AND date = %s",
                    (user_id, yesterday)
                )
                yesterday_result = self.db.cursor.fetchone()

                if yesterday_result['count'] > 0:
                    # Streak continues
                    self.db.cursor.execute(
                        "UPDATE users SET streak_count = streak_count + 1 WHERE id = %s",
                        (user_id,)
                    )
                else:
                    # Streak resets to 1
                    self.db.cursor.execute(
                        "UPDATE users SET streak_count = 1 WHERE id = %s",
                        (user_id,)
                    )

                # Update longest streak if necessary
                self.db.cursor.execute(
                    """UPDATE users SET longest_streak = MAX(longest_streak, streak_count) 
                    WHERE id = %s""",
                    (user_id,)
                )

                self.db.conn.commit()
                return {"success": True, "message": "Streak updated"}
            else:
                return {"success": True, "message": "Already completed today"}

        except Error as e:
            return {"success": False, "error": str(e)}

    def get_streak_calendar(self, user_id, month=None, year=None):
        """Get user's streak calendar for a month"""
        try:
            if month is None:
                month = datetime.now().month
            if year is None:
                year = datetime.now().year

            self.db.cursor.execute(
                """SELECT date, completed_challenge FROM streak_calendar 
                WHERE user_id = %s AND MONTH(date) = %s AND YEAR(date) = %s
                ORDER BY date""",
                (user_id, month, year)
            )
            calendar = self.db.cursor.fetchall()
            return {"success": True, "calendar": calendar}
        except Error as e:
            return {"success": False, "error": str(e)}


class BadgeService:
    def __init__(self, db_conn):
        self.db = db_conn

    def check_and_unlock_badges(self, user_id):
        """Check if user qualifies for any new badges"""
        try:
            # Get user stats
            self.db.cursor.execute(
                """SELECT total_challenges_completed, total_battles_won, 
                streak_count FROM users WHERE id = %s""",
                (user_id,)
            )
            user_stats = self.db.cursor.fetchone()

            badges_unlocked = []

            # Fast Solver Badge - Complete 5 challenges under 2 min
            self.db.cursor.execute(
                """SELECT COUNT(*) as count FROM user_challenges 
                WHERE user_id = %s AND best_time < 120 AND status = 'completed'""",
                (user_id,)
            )
            fast_solver = self.db.cursor.fetchone()
            if fast_solver['count'] >= 5:
                if self._unlock_badge_if_not_exists(user_id, 1):  # Badge ID 1
                    badges_unlocked.append("Fast Solver")

            # 7-Day Streak Badge
            if user_stats['streak_count'] >= 7:
                if self._unlock_badge_if_not_exists(user_id, 2):  # Badge ID 2
                    badges_unlocked.append("7-Day Streak")

            # Coding Beast Badge - Win 10 battles
            if user_stats['total_battles_won'] >= 10:
                if self._unlock_badge_if_not_exists(user_id, 3):  # Badge ID 3
                    badges_unlocked.append("Coding Beast")

            # Code Wizard Badge - Complete 50 challenges
            if user_stats['total_challenges_completed'] >= 50:
                if self._unlock_badge_if_not_exists(user_id, 4):  # Badge ID 4
                    badges_unlocked.append("Code Wizard")

            # Battle Master Badge - Win 25 battles
            if user_stats['total_battles_won'] >= 25:
                if self._unlock_badge_if_not_exists(user_id, 5):  # Badge ID 5
                    badges_unlocked.append("Battle Master")

            return {"success": True, "badges_unlocked": badges_unlocked}

        except Error as e:
            return {"success": False, "error": str(e)}

    def _unlock_badge_if_not_exists(self, user_id, badge_id):
        """Unlock badge if not already unlocked"""
        try:
            self.db.cursor.execute(
                "SELECT COUNT(*) as count FROM user_badges WHERE user_id = %s AND badge_id = %s",
                (user_id, badge_id)
            )
            result = self.db.cursor.fetchone()

            if result['count'] == 0:
                self.db.cursor.execute(
                    "INSERT INTO user_badges (user_id, badge_id) VALUES (%s, %s)",
                    (user_id, badge_id)
                )
                self.db.conn.commit()
                return True
            return False
        except Error as e:
            print(f"Error unlocking badge: {e}")
            return False

    def get_user_badges(self, user_id):
        """Get all badges for user"""
        try:
            self.db.cursor.execute(
                """SELECT b.id, b.name, b.description, b.icon_url, ub.unlocked_at 
                FROM badges b 
                LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = %s
                ORDER BY ub.unlocked_at DESC""",
                (user_id,)
            )
            badges = self.db.cursor.fetchall()
            return {"success": True, "badges": badges}
        except Error as e:
            return {"success": False, "error": str(e)}


class XPService:
    def __init__(self, db_conn):
        self.db = db_conn

    def calculate_bonus_xp(self, user_id, base_xp, bonus_type="daily_multiplier"):
        """Calculate XP with bonuses"""
        try:
            multiplier = 1.0

            if bonus_type == "streak_bonus":
                # Get current streak
                self.db.cursor.execute(
                    "SELECT streak_count FROM users WHERE id = %s",
                    (user_id,)
                )
                result = self.db.cursor.fetchone()
                streak = result['streak_count'] if result else 0
                multiplier = 1.0 + (streak * 0.05)  # 5% per streak day
            elif bonus_type == "level_bonus":
                # Higher levels get more XP
                self.db.cursor.execute(
                    "SELECT level FROM users WHERE id = %s",
                    (user_id,)
                )
                result = self.db.cursor.fetchone()
                level = result['level'] if result else 1
                multiplier = 1.0 + ((level - 1) * 0.05)

            final_xp = int(base_xp * multiplier)
            return {"success": True, "final_xp": final_xp, "multiplier": multiplier}

        except Error as e:
            return {"success": False, "error": str(e), "final_xp": base_xp}


class LeaderboardService:
    def __init__(self, db_conn):
        self.db = db_conn

    def update_leaderboard(self):
        """Update leaderboard rankings"""
        try:
            self.db.cursor.execute(
                """INSERT INTO leaderboard (user_id, rank, total_xp, challenges_completed, battles_won)
                SELECT 
                    u.id,
                    ROW_NUMBER() OVER (ORDER BY u.total_xp DESC),
                    u.total_xp,
                    u.total_challenges_completed,
                    u.total_battles_won
                FROM users u
                ON DUPLICATE KEY UPDATE
                    rank = VALUES(rank),
                    total_xp = VALUES(total_xp),
                    challenges_completed = VALUES(challenges_completed),
                    battles_won = VALUES(battles_won)"""
            )
            self.db.conn.commit()
            return {"success": True, "message": "Leaderboard updated"}
        except Error as e:
            return {"success": False, "error": str(e)}

    def get_top_users(self, limit=10):
        """Get top users by XP"""
        try:
            self.db.cursor.execute(
                """SELECT u.id, u.username, u.avatar_url, u.level, u.total_xp, 
                rank FROM leaderboard l 
                JOIN users u ON l.user_id = u.id 
                ORDER BY l.rank LIMIT %s""",
                (limit,)
            )
            users = self.db.cursor.fetchall()
            return {"success": True, "users": users}
        except Error as e:
            return {"success": False, "error": str(e)}


def main():
    """Main function to run background services"""
    db_conn = DatabaseConnection()

    if db_conn.conn is None:
        print("Failed to connect to database")
        return

    # Initialize services
    notifications = NotificationService(db_conn)
    streaks = StreakService(db_conn)
    badges = BadgeService(db_conn)
    xp_service = XPService(db_conn)
    leaderboard = LeaderboardService(db_conn)

    print("SkillSprint Background Services Started")

    # Example usage (in production, would run periodically)
    try:
        # Update leaderboard
        result = leaderboard.update_leaderboard()
        print(f"Leaderboard update: {result}")

        # Check badges for user 1 (example)
        badge_result = badges.check_and_unlock_badges(1)
        print(f"Badge check: {badge_result}")

    except Exception as e:
        print(f"Error in main: {e}")
    finally:
        db_conn.close()


if __name__ == "__main__":
    main()
