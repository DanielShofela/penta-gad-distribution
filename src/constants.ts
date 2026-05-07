export const CATEGORY_GROUPS = [
  {
    id: 'boutiques',
    name: 'Boutiques Officielles',
    description: 'Les plus grandes marques',
    icon: 'Store',
    categories: [
      { id: 'lg', name: 'LG' },
      { id: 'samsung', name: 'Samsung' },
      { id: 'miele', name: 'Miele' },
    ]
  },
  {
    id: 'telephones',
    name: 'Téléphones & Tablettes',
    description: 'Smartphones and accessories',
    icon: 'Smartphone',
    categories: [
      { id: 'smartphones', name: 'Smartphones' },
      { id: 'tablettes', name: 'Tablettes' },
      { id: 'accessoires-tel', name: 'Accessoires' },
    ]
  },
  {
    id: 'tv-electronique',
    name: 'TV & Electronique',
    description: 'Divertissement à domicile',
    icon: 'Tv',
    categories: [
      { id: 'televisions', name: 'Télévisions' },
      { id: 'son', name: 'Systèmes de son' },
      { id: 'home-cinema', name: 'Home Cinéma' },
    ]
  },
  {
    id: 'electromenager',
    name: 'Électroménager',
    description: 'Pour toute la maison',
    icon: 'CookingPot',
    categories: [
      { id: 'refrigerateurs', name: 'Réfrigérateurs' },
      { id: 'cuisson', name: 'Cuisson' },
      { id: 'lavage', name: 'Lavage' },
    ]
  },
  {
    id: 'maison-bureau',
    name: 'Maison et bureau',
    description: 'Mobilier et décoration',
    icon: 'Home',
    categories: [
      { id: 'salon', name: 'Salon' },
      { id: 'bureau', name: 'Bureau' },
      { id: 'chambre', name: 'Chambre' },
    ]
  },
  {
    id: 'informatique',
    name: 'Informatique',
    description: 'Ordinateurs et périphériques',
    icon: 'Monitor',
    categories: [
      { id: 'ordinateurs', name: 'Ordinateurs' },
      { id: 'imprimantes', name: 'Imprimantes' },
      { id: 'accessoires-pc', name: 'Accessoires PC' },
    ]
  },
  {
    id: 'mode',
    name: 'Mode',
    description: 'Vêtements et accessoires',
    icon: 'Shirt',
    categories: [
      { id: 'homme', name: 'Homme' },
      { id: 'femme', name: 'Femme' },
      { id: 'enfant', name: 'Enfant' },
    ]
  },
  {
    id: 'supermarche',
    name: 'Supermarché',
    description: 'Alimentation et boissons',
    icon: 'Apple',
    categories: [
      { id: 'boissons', name: 'Boissons' },
      { id: 'epicerie', name: 'Épicerie' },
    ]
  },
  {
    id: 'beaute',
    name: 'Beauté & Hygiène',
    description: 'Soins et parfums',
    icon: 'Sparkles',
    categories: [
      { id: 'soins', name: 'Soins du corps' },
      { id: 'hygiene', name: 'Hygiène' },
    ]
  },
  {
    id: 'bebe',
    name: 'Produits pour bébés',
    description: 'Tout pour bébé',
    icon: 'Baby',
    categories: [
      { id: 'puericulture', name: 'Puériculture' },
      { id: 'jouets-bebe', name: 'Jouets' },
    ]
  },
  {
    id: 'agriculture',
    name: 'Agriculture & Élevage',
    description: 'Matériel agricole',
    icon: 'Bird',
    categories: [
      { id: 'elevage', name: 'Élevage' },
      { id: 'culture', name: 'Culture' },
    ]
  },
  {
    id: 'autres',
    name: 'Autres catégories',
    description: 'Plus d\'articles',
    icon: 'MoreHorizontal',
    categories: [
      { id: 'divers', name: 'Divers' },
    ]
  }
];

export const ALL_CATEGORIES = CATEGORY_GROUPS.flatMap(group => group.categories);

export const getCategoryName = (id: string) => {
  return ALL_CATEGORIES.find(cat => cat.id === id)?.name || id;
};
