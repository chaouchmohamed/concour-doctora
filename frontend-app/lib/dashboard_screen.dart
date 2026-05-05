import 'package:flutter/material.dart';
import 'package:flutter_application_3/exam_session_screen.dart';

// ─────────────────────────────────────────────
// Breakpoints
// ─────────────────────────────────────────────
class _BP {
  static const double phone = 600;
  static const double tablet = 900;
}

// ─────────────────────────────────────────────
// Color palette (matches the screenshot)
// ─────────────────────────────────────────────
class _C {
  static const bg = Color(0xFFF7F7F8);
  static const white = Colors.white;
  static const border = Color(0xFFEEEEEE);
  static const sidebarBg = Colors.white;
  static const activeItem = Color(0xFFFCF4ED);
  static const activeBar = Color(0xFFB5855A);
  static const activeText = Color(0xFF7C4F28);
  static const activeIcon = Color(0xFF8B6340);
  static const textPrimary = Color(0xFF111827);
  static const textSecondary = Color(0xFF6B7280);
  static const textMuted = Color(0xFF9CA3AF);

  // stat card accent colors
  static const purple = Color(0xFF7C3AED);
  static const purpleBg = Color(0xFFF5F3FF);
  static const blue = Color(0xFF2563EB);
  static const blueBg = Color(0xFFEFF6FF);
  static const orange = Color(0xFFEA580C);
  static const orangeBg = Color(0xFFFFF7ED);

  // quick tip
  static const tipBg = Color(0xFFFFFBF5);
  static const tipBorder = Color(0xFFFDE8C8);
  static const tipLink = Color(0xFF2563EB);

  // deadline dots
  static const dotRed = Color(0xFFEF4444);
  static const dotAmber = Color(0xFFF59E0B);
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;
  _DashboardSection _selectedSection = _DashboardSection.dashboard;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 480),
    );
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
    _fadeCtrl.forward();
  }

  @override
  void dispose() {
    _fadeCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final isDesktop = w >= _BP.tablet;
        final isTablet = w >= _BP.phone && w < _BP.tablet;
        final isPhone = w < _BP.phone;

        return Scaffold(
          backgroundColor: _C.bg,
          drawer: isDesktop
              ? null
              : Drawer(
                  backgroundColor: _C.sidebarBg,
                  child: _Sidebar(
                    isPhone: isPhone,
                    closeOnSelect: true,
                    selectedSection: _selectedSection,
                    onSectionSelected: _handleSectionSelected,
                  ),
                ),
          body: FadeTransition(
            opacity: _fadeAnim,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Desktop sidebar
                if (isDesktop)
                  SizedBox(
                    width: 240,
                    child: _Sidebar(
                      isPhone: false,
                      closeOnSelect: false,
                      selectedSection: _selectedSection,
                      onSectionSelected: _handleSectionSelected,
                    ),
                  ),

                // ── Main area
                Expanded(
                  child: Column(
                    children: [
                      _Header(showMenu: !isDesktop, isPhone: isPhone),
                      Expanded(
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 220),
                          switchInCurve: Curves.easeOut,
                          switchOutCurve: Curves.easeIn,
                          child: _selectedSection == _DashboardSection.dashboard
                              ? SingleChildScrollView(
                                  key: const ValueKey('dashboard-page'),
                                  padding: EdgeInsets.symmetric(
                                    horizontal: isPhone ? 16 : 28,
                                    vertical: isPhone ? 16 : 24,
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      _WelcomeBanner(isPhone: isPhone),
                                      SizedBox(height: isPhone ? 16 : 24),
                                      _StatCards(
                                        maxWidth: w,
                                        isPhone: isPhone,
                                        isTablet: isTablet,
                                      ),
                                      SizedBox(height: isPhone ? 16 : 24),
                                      _MainContent(
                                        isPhone: isPhone,
                                        isTablet: isTablet,
                                      ),
                                    ],
                                  ),
                                )
                              : const _SupervisorsPage(
                                  key: ValueKey('supervisors-page'),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _handleSectionSelected(_DashboardSection section) {
    if (_selectedSection == section) {
      return;
    }

    setState(() {
      _selectedSection = section;
    });
  }
}

enum _DashboardSection { dashboard, supervisors }

// ─────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────
class _Sidebar extends StatelessWidget {
  final bool isPhone;
  final bool closeOnSelect;
  final _DashboardSection selectedSection;
  final ValueChanged<_DashboardSection> onSectionSelected;

  const _Sidebar({
    required this.isPhone,
    required this.closeOnSelect,
    required this.selectedSection,
    required this.onSectionSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: _C.sidebarBg,
        border: Border(right: BorderSide(color: _C.border)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Logo row
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 16, 20),
            child: Row(
              children: [
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3EDE5),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.school_rounded,
                    size: 20,
                    color: Color(0xFF8B6340),
                  ),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    'ConcoursDoctor',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      color: _C.textPrimary,
                    ),
                  ),
                ),
                const Icon(
                  Icons.chevron_left_rounded,
                  size: 20,
                  color: _C.textMuted,
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),

          // Nav items
          _SidebarItem(
            label: 'Dashboard',
            icon: Icons.grid_view_rounded,
            isActive: selectedSection == _DashboardSection.dashboard,
            onTap: () {
              onSectionSelected(_DashboardSection.dashboard);
              if (closeOnSelect && Navigator.of(context).canPop()) {
                Navigator.of(context).pop();
              }
            },
          ),
          _SidebarItem(
            label: 'Supervisors (PWA)',
            icon: Icons.verified_user_outlined,
            isActive: selectedSection == _DashboardSection.supervisors,
            onTap: () {
              onSectionSelected(_DashboardSection.supervisors);
              if (closeOnSelect && Navigator.of(context).canPop()) {
                Navigator.of(context).pop();
              }
            },
          ),

          const Spacer(),
          const Divider(height: 1, color: _C.border),
          const SizedBox(height: 8),
          _SidebarItem(label: 'Sign out', icon: Icons.logout_rounded),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _SidebarItem extends StatefulWidget {
  final String label;
  final IconData icon;
  final bool isActive;
  final VoidCallback? onTap;
  const _SidebarItem({
    required this.label,
    required this.icon,
    this.isActive = false,
    this.onTap,
  });

  @override
  State<_SidebarItem> createState() => _SidebarItemState();
}

class _SidebarItemState extends State<_SidebarItem> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final active = widget.isActive;
    final hover = _hovered && !active;

    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          margin: const EdgeInsets.only(right: 14, bottom: 2),
          decoration: BoxDecoration(
            color: active
                ? _C.activeItem
                : hover
                ? const Color(0xFFF5F5F5)
                : Colors.transparent,
            borderRadius: const BorderRadius.only(
              topRight: Radius.circular(22),
              bottomRight: Radius.circular(22),
            ),
          ),
          child: Row(
            children: [
              // Active indicator bar
              AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                width: 4,
                height: 24,
                decoration: BoxDecoration(
                  color: active ? _C.activeBar : Colors.transparent,
                  borderRadius: const BorderRadius.only(
                    topRight: Radius.circular(4),
                    bottomRight: Radius.circular(4),
                  ),
                ),
              ),
              const SizedBox(width: 20),
              Icon(
                widget.icon,
                size: 19,
                color: active ? _C.activeIcon : _C.textSecondary,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  child: Text(
                    widget.label,
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: active ? FontWeight.w600 : FontWeight.w500,
                      color: active ? _C.activeText : _C.textSecondary,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SupervisorsPage extends StatelessWidget {
  const _SupervisorsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const ExamSessionScreen();
  }
}

// ─────────────────────────────────────────────
// Header / Top bar
// ─────────────────────────────────────────────
class _Header extends StatelessWidget {
  final bool showMenu;
  final bool isPhone;
  const _Header({required this.showMenu, required this.isPhone});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isPhone ? 12 : 24,
        vertical: 14,
      ),
      decoration: const BoxDecoration(
        color: _C.white,
        border: Border(bottom: BorderSide(color: _C.border)),
      ),
      child: Row(
        children: [
          if (showMenu) ...[
            IconButton(
              icon: const Icon(Icons.menu_rounded, color: _C.textSecondary),
              onPressed: () => Scaffold.of(context).openDrawer(),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
            const SizedBox(width: 10),
          ],
          const Text(
            'Overview',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: _C.textPrimary,
              letterSpacing: -0.3,
            ),
          ),
          const Spacer(),
          // User info (hide email on phone, show initials only)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: const Color(0xFFE5E7EB),
                  borderRadius: BorderRadius.circular(17),
                ),
                child: const Center(
                  child: Text(
                    'YO',
                    style: TextStyle(
                      color: Color(0xFF374151),
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
              if (!isPhone) ...[
                const SizedBox(width: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Text(
                      'younesbelfaci22@gmail.com',
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                        color: _C.textPrimary,
                      ),
                    ),
                    SizedBox(height: 1),
                    Text(
                      'Supervisor',
                      style: TextStyle(fontSize: 11, color: _C.textSecondary),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Welcome Banner
// ─────────────────────────────────────────────
class _WelcomeBanner extends StatelessWidget {
  final bool isPhone;
  const _WelcomeBanner({required this.isPhone});

  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        style: TextStyle(
          fontSize: isPhone ? 13 : 14.5,
          color: _C.textSecondary,
          height: 1.4,
        ),
        children: const [
          TextSpan(text: 'Welcome, '),
          TextSpan(
            text: 'younesbelfaci22@gmail.com',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: _C.textPrimary,
            ),
          ),
          TextSpan(text: '. Your exam room assignment for today.'),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Stat Cards Row
// ─────────────────────────────────────────────
class _StatCards extends StatelessWidget {
  final double maxWidth;
  final bool isPhone;
  final bool isTablet;

  const _StatCards({
    required this.maxWidth,
    required this.isPhone,
    required this.isTablet,
  });

  @override
  Widget build(BuildContext context) {
    final cards = [
      _StatCardData(
        icon: Icons.location_on_outlined,
        iconColor: _C.purple,
        iconBg: _C.purpleBg,
        label: 'YOUR ROOM',
        value: 'A101',
      ),
      _StatCardData(
        icon: Icons.people_outline_rounded,
        iconColor: _C.blue,
        iconBg: _C.blueBg,
        label: 'CANDIDATES',
        value: '53',
      ),
      _StatCardData(
        icon: Icons.access_time_rounded,
        iconColor: _C.orange,
        iconBg: _C.orangeBg,
        label: 'EXAM STARTS IN',
        value: '2h 15m',
      ),
    ];

    // Phone: vertical stack
    if (isPhone) {
      return Column(
        children: cards
            .map(
              (d) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _StatCard(data: d, horizontal: true),
              ),
            )
            .toList(),
      );
    }

    // Tablet: 2 + 1 grid (first row 2 cards, second row 1 wide)
    if (isTablet) {
      return Column(
        children: [
          Row(
            children: [
              Expanded(child: _StatCard(data: cards[0])),
              const SizedBox(width: 14),
              Expanded(child: _StatCard(data: cards[1])),
            ],
          ),
          const SizedBox(height: 14),
          _StatCard(data: cards[2], fullWidth: true),
        ],
      );
    }

    // Desktop: 3 equal columns
    return Row(
      children: cards
          .map(
            (d) => Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: d == cards.last ? 0 : 16),
                child: _StatCard(data: d),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _StatCardData {
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String label;
  final String value;
  const _StatCardData({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.label,
    required this.value,
  });
}

class _StatCard extends StatefulWidget {
  final _StatCardData data;
  final bool horizontal; // phone horizontal layout
  final bool fullWidth;

  const _StatCard({
    required this.data,
    this.horizontal = false,
    this.fullWidth = false,
  });

  @override
  State<_StatCard> createState() => _StatCardState();
}

class _StatCardState extends State<_StatCard> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: widget.fullWidth ? double.infinity : null,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: _C.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: _hovered
                ? widget.data.iconColor.withOpacity(0.35)
                : _C.border,
          ),
          boxShadow: _hovered
              ? [
                  BoxShadow(
                    color: widget.data.iconColor.withOpacity(0.08),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [],
        ),
        child: widget.horizontal
            ? Row(
                children: [
                  _iconBubble(widget.data),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _labelText(widget.data.label),
                      const SizedBox(height: 4),
                      _valueText(widget.data.value, big: false),
                    ],
                  ),
                ],
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _iconBubble(widget.data),
                  const SizedBox(height: 20),
                  _labelText(widget.data.label),
                  const SizedBox(height: 6),
                  _valueText(widget.data.value, big: !widget.fullWidth),
                ],
              ),
      ),
    );
  }

  Widget _iconBubble(_StatCardData d) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(color: d.iconBg, shape: BoxShape.circle),
      child: Icon(d.icon, color: d.iconColor, size: 20),
    );
  }

  Widget _labelText(String t) => Text(
    t,
    style: const TextStyle(
      fontSize: 10.5,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.9,
      color: _C.textMuted,
    ),
  );

  Widget _valueText(String t, {required bool big}) => Text(
    t,
    style: TextStyle(
      fontSize: big ? 28 : 22,
      fontWeight: FontWeight.w800,
      color: _C.textPrimary,
      letterSpacing: -0.5,
    ),
  );
}

// ─────────────────────────────────────────────
// Main content (Exam details + sidebar cards)
// ─────────────────────────────────────────────
class _MainContent extends StatelessWidget {
  final bool isPhone;
  final bool isTablet;
  const _MainContent({required this.isPhone, required this.isTablet});

  @override
  Widget build(BuildContext context) {
    final right = Column(
      children: const [_QuickTip(), SizedBox(height: 16), _UpcomingDeadlines()],
    );

    if (isPhone) {
      return Column(
        children: [const _TodaysExam(), const SizedBox(height: 16), right],
      );
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(flex: 3, child: const _TodaysExam()),
        const SizedBox(width: 20),
        Expanded(flex: 2, child: right),
      ],
    );
  }
}

// ─────────────────────────────────────────────
// Today's Exam card
// ─────────────────────────────────────────────
class _TodaysExam extends StatelessWidget {
  const _TodaysExam();

  @override
  Widget build(BuildContext context) {
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.calendar_today_outlined,
                size: 16,
                color: _C.textSecondary,
              ),
              const SizedBox(width: 8),
              const Text(
                "Today's Exam",
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: _C.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _ExamRow(label: 'SUBJECT', value: 'Mathematics & Logic'),
          _ExamRow(label: 'DATE', value: '2026-03-10'),
          _ExamRow(label: 'START TIME', value: '09:00'),
          _ExamRow(label: 'DURATION', value: '3 hours', isLast: true),
        ],
      ),
    );
  }
}

class _ExamRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isLast;
  const _ExamRow({
    required this.label,
    required this.value,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(bottom: isLast ? 0 : 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.8,
              color: _C.textMuted,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: _C.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Quick Tip card
// ─────────────────────────────────────────────
class _QuickTip extends StatelessWidget {
  const _QuickTip();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _C.tipBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _C.tipBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(
                Icons.lightbulb_outline_rounded,
                size: 16,
                color: _C.textMuted,
              ),
              SizedBox(width: 8),
              Text(
                'Quick Tip',
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w700,
                  color: _C.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          RichText(
            text: const TextSpan(
              style: TextStyle(
                fontSize: 12.5,
                height: 1.55,
                color: _C.textSecondary,
              ),
              children: [
                TextSpan(text: 'Use the '),
                TextSpan(
                  text: 'PWA',
                  style: TextStyle(
                    color: _C.tipLink,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                TextSpan(
                  text:
                      ' on your tablet to mark attendance. Works offline — data syncs automatically when ',
                ),
                TextSpan(
                  text: 'reconnected',
                  style: TextStyle(
                    color: _C.tipLink,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                TextSpan(text: '.'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Upcoming Deadlines card
// ─────────────────────────────────────────────
class _UpcomingDeadlines extends StatelessWidget {
  const _UpcomingDeadlines();

  @override
  Widget build(BuildContext context) {
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Upcoming Deadlines',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: _C.textPrimary,
            ),
          ),
          const SizedBox(height: 18),
          _DeadlineItem(
            dotColor: _C.dotRed,
            title: 'Open PWA attendance app',
            subtitle: '30 min before exam',
          ),
          const SizedBox(height: 16),
          _DeadlineItem(
            dotColor: _C.dotAmber,
            title: 'Submit attendance report',
          ),
        ],
      ),
    );
  }
}

class _DeadlineItem extends StatelessWidget {
  final Color dotColor;
  final String title;
  final String? subtitle;
  const _DeadlineItem({
    required this.dotColor,
    required this.title,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 5),
          child: Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: _C.textPrimary,
                ),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 3),
                Text(
                  subtitle!,
                  style: const TextStyle(
                    fontSize: 11.5,
                    color: _C.textSecondary,
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────
// Generic card wrapper
// ─────────────────────────────────────────────
class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _C.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _C.border),
      ),
      child: child,
    );
  }
}
