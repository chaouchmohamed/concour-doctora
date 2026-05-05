import 'package:flutter/material.dart';
import 'package:flutter_application_3/splashscreen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _obscurePassword = true;
  bool _rememberMe = false;

  final Color _primaryBrown = const Color(0xFFA6937B);
  final Color _textColorDark = const Color(0xFF1E2432);
  final Color _textColorLight = const Color(0xFF757788);
  final Color _textColorGrey = const Color(0xFF8A92A6);

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isDesktop = constraints.maxWidth >= 900;

        return Scaffold(
          backgroundColor: const Color(0xFFF2F4F7), // unified background
          body: isDesktop
              ? Center(
                  child: SingleChildScrollView(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Container(
                        width: 900,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(24),
                          child: IntrinsicHeight(
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                // Left Form Side
                                Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 40,
                                    ),
                                    child: _buildForm(isDesktop: true),
                                  ),
                                ),
                                // Right Promo Side
                                Expanded(child: _buildPromoSide()),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                )
              : Center(
                  child: SingleChildScrollView(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: _buildForm(isDesktop: false),
                    ),
                  ),
                ),
        );
      },
    );
  }

  Widget _buildForm({required bool isDesktop}) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 400),
      padding: isDesktop
          ? const EdgeInsets.symmetric(horizontal: 32)
          : const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
      decoration: isDesktop
          ? null
          : BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Logo Icon
          Center(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF6F4F0), // light beige
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                Icons
                    .hourglass_top_rounded, // Approximation of the hourglass/polygon icon
                color: _primaryBrown,
                size: 28,
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Title
          Text(
            'Sign in to ConcoursDoctor',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: _textColorDark,
            ),
          ),
          const SizedBox(height: 8),

          // Subtitle
          Text(
            'Enter your credentials to access your account',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: _textColorGrey),
          ),
          const SizedBox(height: 32),

          // Email Label
          Text(
            'Email address',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: _textColorDark,
            ),
          ),
          const SizedBox(height: 8),

          // Email TextField
          TextField(
            decoration: InputDecoration(
              hintText: 'doctor@concours.com',
              hintStyle: TextStyle(color: Colors.grey.shade400),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 16,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: _primaryBrown),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Password Label
          Text(
            'Password',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: _textColorDark,
            ),
          ),
          const SizedBox(height: 8),

          // Password TextField
          TextField(
            obscureText: _obscurePassword,
            decoration: InputDecoration(
              hintText: '••••••••',
              hintStyle: TextStyle(color: Colors.grey.shade400),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 16,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: _primaryBrown),
              ),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  color: Colors.grey.shade500,
                  size: 20,
                ),
                onPressed: () {
                  setState(() {
                    _obscurePassword = !_obscurePassword;
                  });
                },
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Remember me & Forgot Password
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  SizedBox(
                    width: 24,
                    height: 24,
                    child: Checkbox(
                      value: _rememberMe,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(4),
                      ),
                      side: BorderSide(color: Colors.grey.shade400),
                      activeColor: _primaryBrown,
                      onChanged: (value) {
                        if (value != null) {
                          setState(() {
                            _rememberMe = value;
                          });
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Remember me',
                    style: TextStyle(fontSize: 14, color: _textColorDark),
                  ),
                ],
              ),
              TextButton(
                onPressed: () {},
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'Forgot password?',
                  style: TextStyle(
                    fontSize: 14,
                    color: _primaryBrown,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Sign in Button
          ElevatedButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => DashboardPage()),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: _primaryBrown,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'Sign in',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(height: 24),

          // Or continue with Divider
          Row(
            children: [
              Expanded(
                child: Divider(color: Colors.grey.shade200, thickness: 1),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'Or continue with',
                  style: TextStyle(color: _textColorGrey, fontSize: 14),
                ),
              ),
              Expanded(
                child: Divider(color: Colors.grey.shade200, thickness: 1),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Sign in with SSO Button
          OutlinedButton.icon(
            onPressed: () {},
            icon: Icon(Icons.account_balance_outlined, color: _primaryBrown),
            label: Text(
              'Sign in with SSO',
              style: TextStyle(
                color: _textColorDark,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              side: BorderSide(color: Colors.grey.shade300),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(height: 32),

          // Sign up Text
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Don\'t have an account? ',
                style: TextStyle(color: _textColorGrey, fontSize: 14),
              ),
              GestureDetector(
                onTap: () {},
                child: Text(
                  'Sign up',
                  style: TextStyle(
                    color: _primaryBrown,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPromoSide() {
    return Container(
      color: const Color(0xFFFAFAFA),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Background decoration - top left
          Positioned(
            top: -40,
            left: -40,
            child: Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                color: const Color(0xFFF2F2F2),
                shape: BoxShape.circle,
              ),
            ),
          ),
          // Background decoration - bottom right
          Positioned(
            bottom: -80,
            right: -80,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                color: const Color(0xFFF2F2F2),
                shape: BoxShape.circle,
              ),
            ),
          ),

          // Main content
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 48.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Medical circle icon
                Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEBE6DD), // light brown/beige
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Icon(
                      Icons.medical_services_outlined,
                      size: 80,
                      color: const Color(0xFFD0C3B1), // lighter brown for icon
                    ),
                  ),
                ),
                const SizedBox(height: 48),

                // Title
                Text(
                  'Advance your career',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: _textColorDark,
                  ),
                ),
                const SizedBox(height: 16),

                // Subtitle
                Text(
                  'Join thousands of medical professionals preparing\nfor excellence with ConcoursDoctor\'s specialized\ntraining platform.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 15,
                    height: 1.5,
                    color: _textColorGrey,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
