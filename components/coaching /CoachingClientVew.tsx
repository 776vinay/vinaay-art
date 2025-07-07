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
import { getWorkoutTemplates, WorkoutTemplate } from '../../lib/workoutTemplates';

const { width } = Dimensions.get('window');

export default function CoachingClientView() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { data, loading, error, refreshData } = useTodayDataNew();

  const [selectedTab, setSelectedTab] = useState('workouts');
  const [refreshing, setRefreshing] = useState(false);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);

  useEffect(() => {
    loadWorkoutTemplates();
  }, []);

  const loadWorkoutTemplates = async () => {
    try {
      // Fetch templates from Supabase database
      const templates = await getWorkoutTemplates();
      setWorkoutTemplates(templates);
    } catch (error) {
      console.error('Error loading workout templates:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    await loadWorkoutTemplates();
    setRefreshing(false);
  };

  const handleTrainingCalendarPress = () => {
    router.push('/training-calendar');
  };

  const handleDayPress = (workout: any) => {
    // Find a template to show - use the first available template
    if (workoutTemplates.length > 0) {
      const template = workoutTemplates[0]; // Use first template as default
      console.log('handleDayPress: workoutTemplates:', workoutTemplates, 'Selected template:', template);
      router.push(`/workout-detail/${template.id}`);
    } else {
      // If no templates available, create a mock one
      router.push('/workout-detail/template-1');
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

  // Mock weekly workouts data - you can replace this with real data from your database
  const weeklyWorkouts = [
    { dayName: 'M', dayNumber: 6, template: { id: '6bc4abee-5ace-4b21-b1ce-dd4ef9be85b4', name: 'Fv' }, completed: true, missed: false },
    { dayName: 'T', dayNumber: 7, template: { id: '030f7d0b-b39f-4f0e-8ee6-4f0d48e3e297', name: 'Vinay' }, completed: false, missed: false },
    { dayName: 'W', dayNumber: 8, template: null, completed: false, missed: false },
    { dayName: 'T', dayNumber: 9, template: { id: '97a7d69a-02ce-4d64-bdff-523c59b95229', name: 'Ad' }, completed: false, missed: false },
    { dayName: 'F', dayNumber: 10, template: { id: '051879ea-1211-4454-9597-73fadb837d8c', name: 'Gg' }, completed: false, missed: false },
    { dayName: 'S', dayNumber: 11, template: null, completed: false, missed: false },
    { dayName: 'S', dayNumber: 12, template: null, completed: false, missed: false },
  ];

  const getWorkoutCount = () => {
    return weeklyWorkouts.filter(w => w.template !== null).length;
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
      
      <View style={styles.weekContainer}>
        {weeklyWorkouts.map((workout, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayButton,
              workout.template && styles.activeDayButton,
              workout.completed && styles.completedDayButton,
              workout.missed && styles.missedDayButton
            ]}
            onPress={() => handleDayPress(workout)}
            disabled={!workout.template}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.dayName,
              workout.template && styles.activeDayName,
              workout.completed && styles.completedDayName,
              workout.missed && styles.missedDayName
            ]}>
              {workout.dayName}
            </Text>
            <Text style={[
              styles.dayNumber,
              workout.template && styles.activeDayNumber,
              workout.completed && styles.completedDayNumber,
              workout.missed && styles.missedDayNumber
            ]}>
              {workout.dayNumber.toString().padStart(2, '0')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.weekSummary}>
        You have {getWorkoutCount()} workouts this week!
      </Text>
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  completedDayButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  missedDayButton: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  dayName: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  activeDayName: {
    color: '#FFFFFF',
  },
  completedDayName: {
    color: '#FFFFFF',
  },
  missedDayName: {
    color: '#FFFFFF',
  },
  dayNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.text,
  },
  activeDayNumber: {
    color: '#FFFFFF',
  },
  completedDayNumber: {
    color: '#FFFFFF',
  },
  missedDayNumber: {
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