import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../auth/login_screen.dart';
import '../auth/register_screen.dart';
import '../offers/offers_list_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final isWide = width > 900;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _TopBar(isWide: isWide),
              _NavBar(isWide: isWide),
              _HeroSection(isWide: isWide),
              _ExploreSection(isWide: isWide),
              _AnnouncementsSection(isWide: isWide),
              _JoinSection(isWide: isWide),
              _Footer(isWide: isWide),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------
// BARRE SUPERIEURE : logo (gauche), "IAI Horizon" (centre), recherche + langue (droite)
// ---------------------------------------------------------------
class _TopBar extends StatelessWidget {
  final bool isWide;
  const _TopBar({required this.isWide});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.white,
      padding: EdgeInsets.symmetric(horizontal: isWide ? 32 : 16, vertical: 12),
      child: Row(
        children: [
          Expanded(
            flex: isWide ? 3 : 2,
            child: const Align(
              alignment: Alignment.centerLeft,
              child: _InstituteLogo(),
            ),
          ),
          Expanded(
            flex: isWide ? 4 : 3,
            child: const Center(child: _HorizonWordmark()),
          ),
          Expanded(
            flex: isWide ? 3 : 2,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                const Expanded(child: _SearchBar()),
                const SizedBox(width: 12),
                if (isWide) const _LanguageSwitcher(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SearchBar extends StatelessWidget {
  const _SearchBar();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 36,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardGrey),
      ),
      child: Row(
        children: [
          const Icon(Icons.search, size: 18, color: AppColors.textMuted),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              decoration: InputDecoration(
                isDense: true,
                border: InputBorder.none,
                hintText: 'Rechercher une filiere, un metier...',
                hintStyle: const TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
              style: const TextStyle(fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}

class _LanguageSwitcher extends StatelessWidget {
  const _LanguageSwitcher();

  @override
  Widget build(BuildContext context) {
    return DropdownButtonHideUnderline(
      child: DropdownButton<String>(
        value: 'FR',
        icon: const Icon(Icons.keyboard_arrow_down, size: 16),
        style: const TextStyle(fontSize: 12, color: AppColors.darkGreen, fontWeight: FontWeight.w600),
        items: const [
          DropdownMenuItem(value: 'FR', child: Text('Francais')),
          DropdownMenuItem(value: 'EN', child: Text('English')),
        ],
        onChanged: (_) {},
      ),
    );
  }
}

class _HorizonWordmark extends StatelessWidget {
  const _HorizonWordmark();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        RichText(
          text: const TextSpan(
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: 0.5),
            children: [
              TextSpan(text: 'IAI ', style: TextStyle(color: AppColors.darkGreen)),
              TextSpan(text: 'Horizon', style: TextStyle(color: AppColors.gold)),
            ],
          ),
        ),
        const SizedBox(height: 4),
        Container(
          height: 3,
          width: 90,
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [AppColors.darkGreen, AppColors.gold]),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      ],
    );
  }
}

class _InstituteLogo extends StatelessWidget {
  const _InstituteLogo();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 26,
          height: 26,
          decoration: BoxDecoration(
            color: AppColors.darkGreen,
            borderRadius: BorderRadius.circular(6),
          ),
          alignment: Alignment.center,
          child: const Text(
            'IAI',
            style: TextStyle(color: AppColors.gold, fontSize: 8, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(width: 6),
        const Flexible(
          child: Text(
            "Institut Africain\nd'Informatique",
            maxLines: 2,
            style: TextStyle(fontSize: 8, color: AppColors.textMuted, height: 1.2),
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------
// MENU DE NAVIGATION
// ---------------------------------------------------------------
class _NavBar extends StatelessWidget {
  final bool isWide;
  const _NavBar({required this.isWide});

  @override
  Widget build(BuildContext context) {
    final items = <Widget>[
      const _NavItem('Accueil'),
      const _NavItem('A propos'),
      _NavItem('Offres & stages', onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (_) => const OffersListScreen()));
      }),
      const _NavItem('Orientation metiers'),
    ];

    return Container(
      color: AppColors.darkGreen,
      padding: EdgeInsets.symmetric(horizontal: isWide ? 32 : 12, vertical: 10),
      child: isWide
          ? Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ...items,
          const SizedBox(width: 32),
          _AuthAction(
            label: 'Se connecter',
            filled: false,
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
          ),
          const SizedBox(width: 12),
          _AuthAction(
            label: "S'inscrire",
            filled: true,
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
          ),
        ],
      )
          : SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            ...items,
            const SizedBox(width: 16),
            _AuthAction(
              label: 'Se connecter',
              filled: false,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
            ),
            const SizedBox(width: 8),
            _AuthAction(
              label: "S'inscrire",
              filled: true,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
            ),
          ],
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  const _NavItem(this.label, {this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: InkWell(
        onTap: onTap ?? () {},
        child: Text(
          label,
          style: const TextStyle(color: AppColors.white, fontSize: 13, fontWeight: FontWeight.w500),
        ),
      ),
    );
  }
}

class _AuthAction extends StatelessWidget {
  final String label;
  final bool filled;
  final VoidCallback onTap;
  const _AuthAction({required this.label, required this.filled, required this.onTap});

  @override
  Widget build(BuildContext context) {
    if (filled) {
      return ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.gold,
          foregroundColor: AppColors.darkGreen,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        ),
        child: Text(label),
      );
    }
    return TextButton(
      onPressed: onTap,
      child: Text(
        label,
        style: const TextStyle(color: AppColors.gold, fontSize: 13, fontWeight: FontWeight.w600),
      ),
    );
  }
}

// ---------------------------------------------------------------
// SECTION 1 : HERO
// ---------------------------------------------------------------
class _HeroSection extends StatelessWidget {
  final bool isWide;
  const _HeroSection({required this.isWide});

  @override
  Widget build(BuildContext context) {
    final textBlock = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'PLATEFORME INTELLIGENTE IAI-CAMEROUN',
          style: TextStyle(color: AppColors.gold, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.2),
        ),
        const SizedBox(height: 12),
        const Text(
          "Bienvenue sur la plateforme mobile intelligente basee sur l'intelligence artificielle",
          style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.darkGreen, height: 1.3),
        ),
        const SizedBox(height: 14),
        const Text(
          "Concue pour accompagner les etudiants de l'Institut Africain d'Informatique (IAI-Cameroun) "
              "dans leur orientation academique et leur insertion professionnelle. Grace a des recommandations "
              "personnalisees, elle aide chaque etudiant a choisir sa filiere selon son profil et a decouvrir "
              "des opportunites de stage et d'emploi adaptees a ses competences. Elle facilite ainsi la transition "
              "entre formation academique et vie professionnelle.",
          style: TextStyle(fontSize: 14, color: AppColors.textMuted, height: 1.6),
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
              child: const Text('Commencer'),
            ),
            const SizedBox(width: 12),
            OutlinedButton(
              onPressed: () {},
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.darkGreen,
                side: const BorderSide(color: AppColors.darkGreen),
                padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('En savoir plus'),
            ),
          ],
        ),
      ],
    );

    final imageBlock = Container(
      height: isWide ? 320 : 200,
      decoration: BoxDecoration(
        color: const Color(0xFFEAF3DE),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFC0DD97)),
      ),
      alignment: Alignment.center,
      child: const Icon(Icons.school_outlined, size: 64, color: AppColors.darkGreenLight),
    );

    return Container(
      color: AppColors.white,
      padding: EdgeInsets.symmetric(horizontal: isWide ? 32 : 16, vertical: isWide ? 48 : 28),
      child: isWide
          ? Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(flex: 6, child: textBlock),
          const SizedBox(width: 40),
          Expanded(flex: 5, child: imageBlock),
        ],
      )
          : Column(children: [textBlock, const SizedBox(height: 24), imageBlock]),
    );
  }
}

// ---------------------------------------------------------------
// SECTION 2 : GRID
// ---------------------------------------------------------------
class _ExploreSection extends StatelessWidget {
  final bool isWide;
  const _ExploreSection({required this.isWide});

  @override
  Widget build(BuildContext context) {
    final cards = [
      const _ExploreCard(
        icon: Icons.location_city,
        title: 'Emplois dans ta ville',
        subtitle: 'Decouvre les opportunites professionnelles disponibles pres de chez toi, filtrees selon ta region.',
      ),
      const _ExploreCard(
        icon: Icons.work_outline,
        title: 'Lieux & stages',
        subtitle: "Trouve les entreprises partenaires qui accueillent des stagiaires dans ton domaine d'etude.",
      ),
      const _ExploreCard(
        icon: Icons.explore_outlined,
        title: 'Conseil & orientation',
        subtitle: "L'intelligence artificielle analyse ton profil pour te proposer la filiere qui te correspond le mieux.",
      ),
    ];

    return Container(
      color: AppColors.background,
      padding: EdgeInsets.symmetric(horizontal: isWide ? 32 : 16, vertical: isWide ? 40 : 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Explorez la plateforme',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.darkGreen)),
          const SizedBox(height: 20),
          isWide
              ? Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: cards.map((c) => Expanded(child: Padding(padding: const EdgeInsets.only(right: 16), child: c))).toList(),
          )
              : Column(children: cards.map((c) => Padding(padding: const EdgeInsets.only(bottom: 16), child: c)).toList()),
        ],
      ),
    );
  }
}

class _ExploreCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  const _ExploreCard({required this.icon, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cardGrey.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 90,
            width: double.infinity,
            decoration: BoxDecoration(color: AppColors.cardGrey, borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: AppColors.textMuted, size: 30),
          ),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textDark)),
          const SizedBox(height: 6),
          Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textMuted, height: 1.5)),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------
// SECTION 3 : ANNONCES
// ---------------------------------------------------------------
class _AnnouncementsSection extends StatelessWidget {
  final bool isWide;
  const _AnnouncementsSection({required this.isWide});

  @override
  Widget build(BuildContext context) {
    final announcements = [
      const _Announcement(
          tag: 'Stage', tagColor: Color(0xFF27500A), tagBg: Color(0xFFEAF3DE),
          title: 'Developpeur mobile Flutter', location: 'Douala, Cameroun'),
      const _Announcement(
          tag: 'Formation', tagColor: Color(0xFF633806), tagBg: Color(0xFFFAEEDA),
          title: 'Certification en intelligence artificielle', location: 'En ligne'),
      const _Announcement(
          tag: 'Emploi', tagColor: Color(0xFF04342C), tagBg: Color(0xFFE1F5EE),
          title: 'Data analyst junior', location: 'Yaounde, Cameroun'),
    ];

    return Container(
      color: AppColors.white,
      padding: EdgeInsets.symmetric(horizontal: isWide ? 32 : 16, vertical: isWide ? 40 : 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Annonces recentes',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.darkGreen)),
          const SizedBox(height: 4),
          const Text("Stages, formations et offres d'emploi selectionnes pour toi",
              style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
          const SizedBox(height: 20),
          isWide
              ? Row(
            children: announcements.map((a) => Expanded(child: Padding(padding: const EdgeInsets.only(right: 16), child: a))).toList(),
          )
              : Column(
            children: announcements.map((a) => Padding(padding: const EdgeInsets.only(bottom: 16), child: a)).toList(),
          ),
        ],
      ),
    );
  }
}

class _Announcement extends StatelessWidget {
  final String tag;
  final Color tagColor;
  final Color tagBg;
  final String title;
  final String location;
  const _Announcement({required this.tag, required this.tagColor, required this.tagBg, required this.title, required this.location});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.cardGrey.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: tagBg, borderRadius: BorderRadius.circular(20)),
            child: Text(tag, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: tagColor)),
          ),
          const SizedBox(height: 10),
          Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textDark)),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.place_outlined, size: 14, color: AppColors.textMuted),
              const SizedBox(width: 4),
              Text(location, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
            ],
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------
// SECTION JOIN + FOOTER
// ---------------------------------------------------------------
class _JoinSection extends StatelessWidget {
  final bool isWide;
  const _JoinSection({required this.isWide});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.darkGreen,
      padding: EdgeInsets.symmetric(horizontal: isWide ? 32 : 16, vertical: isWide ? 48 : 32),
      child: Column(
        children: [
          const Text('Prêt à construire ton avenir professionnel ?',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.white, fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          const Text('Rejoins IAI Horizon et decouvre la filiere qui te correspond.',
              textAlign: TextAlign.center, style: TextStyle(color: Color(0xFFDCE8E0), fontSize: 13)),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.gold, foregroundColor: AppColors.darkGreen),
            child: const Text("S'inscrire gratuitement"),
          ),
        ],
      ),
    );
  }
}

class _Footer extends StatelessWidget {
  final bool isWide;
  const _Footer({required this.isWide});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF08402A),
      padding: EdgeInsets.symmetric(horizontal: isWide ? 32 : 16, vertical: 24),
      alignment: Alignment.center,
      child: const Text(
        '© 2026 IAI Horizon — Institut Africain d\'Informatique, Cameroun',
        style: TextStyle(color: Color(0xFFB9CFC2), fontSize: 12),
      ),
    );
  }
}
