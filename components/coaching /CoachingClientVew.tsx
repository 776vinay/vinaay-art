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
  Dumbbell, 
  Clock, 
  Flame,
  Trophy,
  Play,
  Calendar,
  TrendingUp,
  ChevronRight,
  Users,
  Target,
  Award,
  Activity
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { router } from 'expo-router';
import { useTodayDataNew } from '../../hooks/useTodayDataNew';
import { getWorkoutTemplates, initializeDefaultTemplates, WorkoutTemplate } from '../../lib/workoutTemplates';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface WeeklyWorkout {
  id: string;
  date: string;
  dayName: string;
  dayNumber: number;
  template_id: string | null;
  completed: boolean;
  scheduled: boolean;
}

export default function CoachingClientView() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { data, loading, error, refreshData } = useTodayDataNew();

  const [selectedTab, setSelectedTab] = useState('workouts');
  const [refreshing, setRefreshing] = useState(false);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<WeeklyWorkout[]>([]);
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  useEffect(() => {
    loadWorkoutTemplates();
  }, []);

  useEffect(() => {
    if (data?.profile?.id) {
      loadWeeklySchedule();
    }
  }, [data?.profile?.id]);

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

  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1); // Get Monday of current week
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const loadWeeklySchedule = async () => {
    if (!data?.profile?.id) {
      console.warn('No user profile found');
      return;
    }

    try {
      setLoadingWeekly(true);
      const weekDates = getWeekDates();
      const startDate = weekDates[0].toISOString().split('T')[0];
      const endDate = weekDates[6].toISOString().split('T')[0];

      console.log('Fetching workout sessions for:', {
        client_id: data.profile.id,
        startDate,
        endDate
      });

      // Fetch workout sessions for the week
      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('client_id', data.profile.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching workout sessions:', error);
        setWeeklyWorkouts([]);
        return;
      }

      console.log('Fetched sessions:', sessions);

      // Also fetch training sessions if user is a client
      const { data: trainingSessions, error: trainingError } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('client_id', data.profile.id)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true });

      if (trainingError) {
        console.error('Error fetching training sessions:', trainingError);
      }

      console.log('Fetched training sessions:', trainingSessions);

      // Create weekly schedule with all 7 days
      const weeklySchedule: WeeklyWorkout[] = [];
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      weekDates.forEach((date, index) => {
        const dateString = date.toISOString().split('T')[0];
        
        // Check for workout session
        const workoutSession = sessions?.find(s => s.date === dateString);
        
        // Check for training session
        const trainingSession = trainingSessions?.find(s => s.scheduled_date === dateString);
        
        // Prefer workout session over training session
        const session = workoutSession || trainingSession;
        
        const workoutData: WeeklyWorkout = {
          id: session?.id || `${dateString}-${index}`,
          date: dateString,
          dayName: dayNames[index],
          dayNumber: date.getDate(),
          template_id: session?.template_id || null,
          completed: session?.completed || session?.status === 'completed' || false,
          scheduled: !!session && !session?.completed && session?.status !== 'completed'
        };

        weeklySchedule.push(workoutData);
      });

      console.log('Generated weekly schedule:', weeklySchedule);
      setWeeklyWorkouts(weeklySchedule);
    } catch (error) {
      console.error('Error loading weekly schedule:', error);
      setWeeklyWorkouts([]);
    } finally {
      setLoadingWeekly(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    await loadWorkoutTemplates();
    if (data?.profile?.id) {
      await loadWeeklySchedule();
    }
    setRefreshing(false);
  };

  const handleTrainingCalendarPress = () => {
    router.push('/training-calendar');
  };

  const handleDayPress = (workout: WeeklyWorkout) => {
    if (workout.template_id) {
      router.push(`/workout-detail/${workout.template_id}`);
    } else if (workout.scheduled) {
      // If scheduled but no template, show available templates
      if (workoutTemplates.length > 0) {
        router.push(`/workout-detail/${workoutTemplates[0].id}`);
      }
    } else {
      // Show available templates for rest days
      if (workoutTemplates.length > 0) {
        router.push(`/workout-detail/${workoutTemplates[0].id}`);
      }
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getWorkoutCount = () => {
    return weeklyWorkouts.filter(w => w.template_id !== null || w.scheduled).length;
  };

  const renderWeeklyCalendar = () => (
    <View style={styles.calendarSection}>
      <TouchableOpacity 
        style={styles.calendarHeader}
        onPress={handleTrainingCalendarPress}
        activeOpacity={0.7}
      >
        <Text style={styles.calendarTitle}>Training (this week)</Text>
        <ChevronRight size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      
      {loadingWeekly ? (
        <View style={styles.loadingWeekly}>
          <Text style={styles.loadingText}>Loading weekly schedule...</Text>
        </View>
      ) : (
        <>
          <View style={styles.weekContainer}>
            {weeklyWorkouts.map((workout, index) => {
              const hasWorkout = workout.template_id !== null || workout.scheduled;
              const isScheduled = workout.scheduled && !workout.completed;
              
              return (
                <TouchableOpacity
                  key={workout.id}
                  style={[
                    styles.dayButton,
                    hasWorkout && styles.activeDayButton,
                    workout.completed && styles.completedDayButton,
                    isScheduled && styles.scheduledDayButton
                  ]}
                  onPress={() => handleDayPress(workout)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dayName,
                    hasWorkout && styles.activeDayName,
                    workout.completed && styles.completedDayName,
                    isScheduled && styles.scheduledDayName
                  ]}>
                    {workout.dayName}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    hasWorkout && styles.activeDayNumber,
                    workout.completed && styles.completedDayNumber,
                    isScheduled && styles.scheduledDayNumber
                  ]}>
                    {workout.dayNumber.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <Text style={styles.weekSummary}>
            You have {getWorkoutCount()} workouts this week!
          </Text>
        </>
      )}
    </View>
  );

  const renderTaskSection = () => (
    <View style={styles.taskSection}>
      <Text style={styles.taskTitle}>Task (last 7 days)</Text>
      <Text style={styles.taskMessage}>There are no tasks</Text>
    </View>
  );

  const renderMacrosSection = () => (
    <View style={styles.macrosSection}>
      <Text style={styles.macrosTitle}>Macros</Text>
      <View style={styles.macrosContent}>
        <View style={styles.macrosText}>
          <Text style={styles.macrosDescription}>
            Start by setting your daily goal
          </Text>
          <TouchableOpacity 
            style={styles.macrosButton}
            onPress={() => router.push('/food-journal')}
          >
            <Text style={styles.macrosButtonText}>Set daily goal</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.macrosEmoji}>🥗🍎🥕</Text>
      </View>
    </View>
  );

  const renderResourcesSection = () => (
    <View style={styles.resourcesSection}>
      <Text style={styles.resourcesTitle}>Resources</Text>
      <View style={styles.resourcesGrid}>
        <TouchableOpacity style={styles.resourceCard}>
          <Text style={styles.resourceTitle}>Welcome Kit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resourceCard}>
          <Text style={styles.resourceTitle}>Nutrition Resources</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resourceCard}>
          <Text style={styles.resourceTitle}>Other Resources</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAchievementsTab = () => {
    const achievements = [
      { name: '7-Day Streak', icon: '🔥', completed: false, progress: 3 },
      { name: 'First Workout', icon: '💪', completed: true, progress: 1 },
      { name: '100 Workouts', icon: '🏆', completed: false, progress: 23 },
    ];

    return (
      <>
        {/* Achievement Progress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Your Progress</Text>
            <Trophy size={24} color={colors.warning} />
          </View>
          
          <Text style={styles.achievementSummary}>
            You've unlocked 1 out of 3 achievements. Keep going!
          </Text>
          
          <View style={styles.achievementProgressBar}>
            <View style={[styles.achievementProgress, { width: '33.33%' }]} />
          </View>
        </View>

        {/* Achievement List */}
        <Text style={styles.sectionTitle}>Achievements</Text>
        
        {achievements.map((achievement, index) => (
          <View key={index} style={styles.achievementCard}>
            <View style={styles.achievementIcon}>
              <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
            </View>
            
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>{achievement.name}</Text>
              <Text style={styles.achievementProgressText}>
                {achievement.completed 
                  ? 'Completed!' 
                  : `${achievement.progress}/${achievement.name === '7-Day Streak' ? 7 : achievement.name === '100 Workouts' ? 100 : 1}`
                }
              </Text>
            </View>
            
            {achievement.completed && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>✓</Text>
              </View>
            )}
          </View>
        ))}
      </>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your coaching data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load data</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Coaching</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'workouts' && styles.activeTab]}
            onPress={() => setSelectedTab('workouts')}
          >
            <Text style={[styles.tabText, selectedTab === 'workouts' && styles.activeTabText]}>
              Workouts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'achievements' && styles.activeTab]}
            onPress={() => setSelectedTab('achievements')}
          >
            <Text style={[styles.tabText, selectedTab === 'achievements' && styles.activeTabText]}>
              Achievements
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {selectedTab === 'workouts' ? (
          <>
            {/* Weekly Training Calendar */}
            {renderWeeklyCalendar()}

            {/* Task Section */}
            {renderTaskSection()}

            {/* Macros Section */}
            {renderMacrosSection()}

            {/* Resources Section */}
            {renderResourcesSection()}

            {/* Trainer/Team Info */}
            {data && 'clientAssignment' in data && data.clientAssignment && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Your Team</Text>
                  <Users size={24} color={colors.info} />
                </View>
                
                {data.clientAssignment.trainer && (
                  <View style={styles.teamMember}>
                    <Text style={styles.teamMemberRole}>Trainer</Text>
                    <Text style={styles.teamMemberName}>{data.clientAssignment.trainer.full_name}</Text>
                  </View>
                )}
                
                {data.clientAssignment.nutritionist && (
                  <View style={styles.teamMember}>
                    <Text style={styles.teamMemberRole}>Nutritionist</Text>
                    <Text style={styles.teamMemberName}>{data.clientAssignment.nutritionist.full_name}</Text>
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          renderAchievementsTab()
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
    color: colors.text,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: colors.text,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: colors.surface,
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  calendarSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  calendarTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  loadingWeekly: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayButton: {
    width: 40,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeDayButton: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
  },
  scheduledDayButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  completedDayButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  dayName: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  activeDayName: {
    color: colors.text,
  },
  scheduledDayName: {
    color: '#FFFFFF',
  },
  completedDayName: {
    color: '#FFFFFF',
  },
  dayNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.text,
  },
  activeDayNumber: {
    color: colors.text,
  },
  scheduledDayNumber: {
    color: '#FFFFFF',
  },
  completedDayNumber: {
    color: '#FFFFFF',
  },
  weekSummary: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  taskSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  taskTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 12,
  },
  taskMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  macrosSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  macrosTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  macrosContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  macrosText: {
    flex: 1,
  },
  macrosDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  macrosButton: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  macrosButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  macrosEmoji: {
    fontSize: 32,
    marginLeft: 16,
  },
  resourcesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  resourcesTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resourceCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  resourceTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
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
  achievementSummary: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  achievementProgressBar: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  achievementProgress: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 4,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  achievementCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  achievementProgressText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  completedBadge: {
    width: 24,
    height: 24,
    backgroundColor: colors.success,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
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
});