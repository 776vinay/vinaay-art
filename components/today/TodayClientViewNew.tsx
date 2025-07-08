// components/today/TodayClientViewNew.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Plus, 
  Footprints, 
  Target, 
  UtensilsCrossed,
  TrendingUp,
  Calendar,
  X,
  Play,
  Dumbbell,
  Clock,
  ChevronRight,
  Flame,
  Users
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { useTodayData } from '../../hooks/useTodayData';
import { router } from 'expo-router';
import { getWorkoutTemplates, initializeDefaultTemplates, WorkoutTemplate } from '../../lib/workoutTemplates';

const { width } = Dimensions.get('window');

export default function TodayClientView() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { profile, todayStats, workoutSessions, activeGoals, clientAssignment, loading, refreshData } = useTodayData();

  const [showMissedWorkout, setShowMissedWorkout] = useState(true);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);

  useEffect(() => {
    loadWorkoutTemplates();
  }, []);

  const loadWorkoutTemplates = async () => {
    try {
      // Initialize default templates if none exist
      await initializeDefaultTemplates();
      
      // Load templates from database
      const templates = await getWorkoutTemplates();
      setWorkoutTemplates(templates);
    } catch (error) {
      console.error('Error loading workout templates:', error);
    }
  };

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }).toUpperCase();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userName = profile?.full_name?.split(' ')[0] || 'User';
  const steps = todayStats?.steps || 0;
  const stepGoal = 10000;
  const stepProgress = (steps / stepGoal) * 100;

  // Get today's workout - use first available template if no specific workout
  // Filter for sessions that are not yet completed
  const todaysWorkout = workoutSessions.find(session => session.status !== 'completed') || 
    (workoutTemplates.length > 0 ? { 
      id: workoutTemplates[0].id, 
      exercises: workoutTemplates[0].exercises,
      duration_minutes: workoutTemplates[0].estimated_duration_minutes, // Corrected property name
      template: workoutTemplates[0]
    } : null);
  
  const completedWorkouts = workoutSessions.filter(session => session.status === 'completed'); // Corrected status check

  // Get active goal
  const activeGoal = activeGoals[0] || {
    title: 'Set your first goal',
    emoji: '🎯',
    progress_percentage: 0,
    target_date: null,
  };

  const calculateDaysLeft = (targetDate: string | null) => {
    if (!targetDate) return 0;
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysLeft = calculateDaysLeft(activeGoal.target_date);

  const handleFabPress = () => {
    router.push('/activities');
  };

  const handleStartWorkout = () => {
    if (todaysWorkout) {
      router.push(`/start-workout/${todaysWorkout.id}`);
    }
  };

  const handleWorkoutCardPress = () => {
    if (todaysWorkout) {
      router.push(`/workout-detail/${todaysWorkout.id}` as any);
    }
  };

  const handleGoalPress = () => {
    router.push('/fitness-goals');
  };

  const handleSetMacrosGoal = () => {
    router.push('/set-macros-goal');
  };

  const handleAddMeal = () => {
    router.push('/food-journal');
  };

  const handleRefresh = async () => {
    await refreshData();
    await loadWorkoutTemplates();
  };

  const renderTodaysWorkout = () => {
    if (!todaysWorkout) {
      return (
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#1E40AF', '#3730A3'] : ['#667EEA', '#764BA2']}
          style={styles.restDayCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.restDayContent}>
            <Text style={styles.restDayLabel}>REST DAY</Text>
            <Text style={styles.restDayMessage}>
              Hoo-ray it's your rest-day 🌴
            </Text>
          </View>
        </LinearGradient>
      );
    }

    return (
      <TouchableOpacity 
        style={styles.workoutCardContainer}
        onPress={handleWorkoutCardPress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#BE185D', '#BE123C'] : ['#F093FB', '#F5576C']}
          style={styles.workoutCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.workoutContent}>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutLabel}>TODAY'S WORKOUT</Text>
              <Text style={styles.workoutName}>
                {todaysWorkout.template?.name || 
                 (todaysWorkout.exercises?.length ? `${todaysWorkout.exercises.length} exercises` : 'Custom Workout')}
              </Text>
              <Text style={styles.workoutDetails}>
                {todaysWorkout.duration_minutes ? `${todaysWorkout.duration_minutes} min` : 'Duration varies'}
              </Text>
            </View>
            <TouchableOpacity style={styles.playButton} onPress={handleStartWorkout}>
              <Play size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: colors.background }]} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dateText}>{getCurrentDate()}</Text>
          <Text style={styles.greetingText}>
            {getGreeting()}, {userName}! 👋
          </Text>
        </View>

        {/* Today's Workout */}
        {renderTodaysWorkout()}

        {/* Fitness Goal Card */}
        <TouchableOpacity style={styles.goalCard} onPress={handleGoalPress}>
          <View style={styles.goalHeader}>
            <View style={styles.goalTitleContainer}>
              <Text style={styles.goalEmoji}>{activeGoal.emoji}</Text>
              <View>
                <Text style={styles.goalTitle}>{activeGoal.title}</Text>
                <Text style={styles.goalSubtitle}>
                  {daysLeft > 0 ? `${daysLeft} days left` : 'No target date'} • {activeGoal.progress_percentage}% complete
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.addGoalButton}
              onPress={() => router.push('/set-fitness-goal')}
            >
              <Plus size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.goalProgressContainer}>
            <View style={styles.goalProgressBar}>
              <View 
                style={[
                  styles.goalProgressFill, 
                  { width: `${activeGoal.progress_percentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.goalProgressText}>{activeGoal.progress_percentage}%</Text>
          </View>

          {daysLeft > 0 && (
            <View style={styles.goalCountdown}>
              <Clock size={16} color={colors.textSecondary} />
              <Text style={styles.goalCountdownText}>
                {daysLeft} days remaining
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Missed Workout Alert */}
        {showMissedWorkout && completedWorkouts.length === 0 && (
          <View style={styles.alertCard}>
            <View style={styles.alertContent}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <Text style={styles.alertText}>
                You haven't completed any workouts today
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowMissedWorkout(false)}
              style={styles.alertClose}
            >
              <X size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {/* Steps Tracker */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Steps tracker</Text>
            <Footprints size={24} color={colors.primary} />
          </View>
          
          <View style={styles.stepsContent}>
            <View style={styles.stepsInfo}>
              <Text style={styles.stepsNumber}>
                {steps.toLocaleString()}
              </Text>
              <Text style={styles.stepsGoal}>/ {stepGoal.toLocaleString()} steps</Text>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min(stepProgress, 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{Math.round(stepProgress)}%</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <Dumbbell size={24} color={colors.success} />
          </View>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/templates')}
            >
              <Text style={styles.actionButtonText}>View Templates</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/workout-history')}
            >
              <Text style={styles.actionButtonText}>Workout History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Macros */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Macros</Text>
            <Target size={24} color={colors.success} />
          </View>
          
          <Text style={styles.cardSubtitle}>
            Start by setting your daily goal
          </Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleSetMacrosGoal}>
            <Text style={styles.actionButtonText}>Set daily goal</Text>
          </TouchableOpacity>
        </View>

        {/* Food Journal */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Food Journal</Text>
            <UtensilsCrossed size={24} color={colors.warning} />
          </View>
          
          <Text style={styles.cardSubtitle}>
            What did you eat today?
          </Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleAddMeal}>
            <Text style={styles.actionButtonText}>Add meal</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Progress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Progress</Text>
            <TrendingUp size={24} color={colors.error} />
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{completedWorkouts.length}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{todayStats?.calories_consumed || 0}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{((todayStats?.water_intake_ml || 0) / 1000).toFixed(1)}</Text>
              <Text style={styles.statLabel}>Water (L)</Text>
            </View>
          </View>
        </View>

        {/* Trainer/Nutritionist Info */}
        {clientAssignment && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Your Team</Text>
              <Users size={24} color={colors.info} />
            </View>
            
            {clientAssignment.trainer && (
              <View style={styles.teamMember}>
                <Text style={styles.teamMemberRole}>Trainer</Text>
                <Text style={styles.teamMemberName}>{clientAssignment.trainer.full_name}</Text>
              </View>
            )}
            
            {clientAssignment.nutritionist && (
              <View style={styles.teamMember}>
                <Text style={styles.teamMemberRole}>Nutritionist</Text>
                <Text style={styles.teamMemberName}>{clientAssignment.nutritionist.full_name}</Text>
              </View>
            )}
          </View>
        )}

        {/* Spacing for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleFabPress}>
        <Plus size={28} color="#FFFFFF" strokeWidth={2} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  dateText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  greetingText: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: colors.text,
    marginTop: 4,
  },
  restDayCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 24,
  },
  restDayContent: {
    alignItems: 'flex-start',
  },
  restDayLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  restDayMessage: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  workoutCardContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  workoutCard: {
    borderRadius: 16,
    padding: 24,
  },
  workoutContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  workoutName: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  workoutDetails: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  playButton: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  goalEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  goalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  goalSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  addGoalButton: {
    width: 32,
    height: 32,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    marginRight: 12,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  goalProgressText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: colors.success,
    minWidth: 40,
  },
  goalCountdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalCountdownText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  alertCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  alertContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  alertText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  alertClose: {
    padding: 4,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  cardSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  stepsContent: {
    alignItems: 'flex-start',
  },
  stepsInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  stepsNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: colors.text,
  },
  stepsGoal: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.primary,
    minWidth: 35,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  teamMember: {
    marginBottom: 12,
  },
  teamMemberRole: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  teamMemberName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
});
