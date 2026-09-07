import { Database as DatabaseType } from 'better-sqlite3';
import { Router, Request, Response } from 'express';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function setupAnDa(db: DatabaseType): Router {
  const router = Router();

  // 1. INIZIALIZZAZIONE TABELLE SECONDO SCHEMA EXACT UTENTE
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT,
      category_id INTEGER,
      description TEXT,
      image_url TEXT,
      is_parametric BOOLEAN DEFAULT 0,
      calculator_name TEXT,
      prep_time INTEGER,
      cook_time INTEGER,
      difficulty TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER,
      phase INTEGER DEFAULT 1,
      name TEXT NOT NULL,
      quantity TEXT,
      unit TEXT,
      notes TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS predefined_quantities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER,
      quantity_name TEXT,
      multiplier REAL,
      base_value INTEGER,
      FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS procedures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER,
      step_number INTEGER,
      phase INTEGER DEFAULT 1,
      description TEXT NOT NULL,
      image_url TEXT,
      timer_minutes INTEGER,
      FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
    CREATE INDEX IF NOT EXISTS idx_ingredients_recipe ON ingredients(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_predefined_recipe ON predefined_quantities(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_procedures_recipe ON procedures(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
    CREATE INDEX IF NOT EXISTS idx_recipes_category_id ON recipes(category_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_slug ON recipes(slug);
  `);

  // Trigger per aggiornare updated_at
  try {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_recipes_timestamp 
      AFTER UPDATE ON recipes
      BEGIN
        UPDATE recipes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);
  } catch (e) {}

  // 2. SEED DATI INIZIALI SE VUOTO
  const recCount = (db.prepare('SELECT COUNT(*) as c FROM recipes').get() as any).c;
  if (recCount === 0) {
    const seedCategories = [
      {
        id: 1,
        name: 'Pizze & Lievitati',
        slug: 'pizze-lievitati',
        description: 'Impasti napoletani, teglia romana, focacce ad alta idratazione e pinsa.',
        icon: 'Pizza',
        sort_order: 1
      },
      {
        id: 2,
        name: 'Pani & Lievito Madre',
        slug: 'pani-lievito-madre',
        description: 'Pagnotte a fermentazione naturale lenta, ciabatte, baguette e grissini.',
        icon: 'Wheat',
        sort_order: 2
      },
      {
        id: 3,
        name: 'Pasta Fresca & Primi',
        slug: 'pasta-primi',
        description: 'Pasta all uovo emiliana, ripieni, gnocchi di patate e salse d autore.',
        icon: 'Utensils',
        sort_order: 3
      },
      {
        id: 4,
        name: 'Pasticceria & Dolci',
        slug: 'dolci-dessert',
        description: 'Grandi lievitati dolci, brioche sfogliate, crostate e dessert al cucchiaio.',
        icon: 'Cake',
        sort_order: 4
      },
      {
        id: 5,
        name: 'Basi & Prefermenti',
        slug: 'basi-prefermenti',
        description: 'Biga, poolish, pasta madre solida e licoli, salse madri e marinate.',
        icon: 'FlaskConical',
        sort_order: 5
      }
    ];

    const insertCat = db.prepare(`
      INSERT OR IGNORE INTO categories (id, name, slug, description, icon, sort_order)
      VALUES (@id, @name, @slug, @description, @icon, @sort_order)
    `);
    for (const c of seedCategories) {
      insertCat.run(c);
    }

    const insertRecipe = db.prepare(`
      INSERT INTO recipes (id, name, slug, category, category_id, description, image_url, is_parametric, calculator_name, prep_time, cook_time, difficulty)
      VALUES (@id, @name, @slug, @category, @category_id, @description, @image_url, @is_parametric, @calculator_name, @prep_time, @cook_time, @difficulty)
    `);

    const insertIng = db.prepare(`
      INSERT INTO ingredients (recipe_id, phase, name, quantity, unit, notes, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPred = db.prepare(`
      INSERT INTO predefined_quantities (recipe_id, quantity_name, multiplier, base_value)
      VALUES (?, ?, ?, ?)
    `);

    const insertProc = db.prepare(`
      INSERT INTO procedures (recipe_id, step_number, phase, description, image_url, timer_minutes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // RICETTA 1: Pizza Napoletana Contemporanea con Biga 100% (Parametrica per Panetto da 270g)
    insertRecipe.run({
      id: 1,
      name: 'Pizza Napoletana con Biga al 100%',
      slug: 'pizza-napoletana-biga-100',
      category: 'Pizze & Lievitati',
      category_id: 1,
      description: 'Impasto contemporaneo a 68% di idratazione con biga fermentata 16h a 18°C. Cornicione alto, leggerissimo, scioglievole e riccamente alveolato.',
      image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80',
      is_parametric: 1,
      calculator_name: 'Calcolatore Panetti Pizza (270g cad.)',
      prep_time: 45,
      cook_time: 2,
      difficulty: 'Media'
    });

    insertPred.run(1, '2 Panetti (Cena Coppia)', 0.5, 2);
    insertPred.run(1, '4 Panetti [Standard 4x270g]', 1.0, 4);
    insertPred.run(1, '6 Panetti (Serata Amici)', 1.5, 6);
    insertPred.run(1, '8 Panetti (Festa Famiglia)', 2.0, 8);
    insertPred.run(1, '12 Panetti (Party Pizza)', 3.0, 12);

    // Ingredienti R1
    // Fase 1: Biga al 100%
    insertIng.run(1, 1, 'Farina di grano tenero Tipo 0 (W300-320)', '650', 'g', 'Forza medio-alta con P/L 0.55', 1);
    insertIng.run(1, 1, 'Acqua fredda da frigorifero (4-6°C)', '290', 'ml', 'Idratazione iniziale al 45%', 2);
    insertIng.run(1, 1, 'Lievito di birra fresco compresso', '6.5', 'g', 'Sbriciolato grossolanamente', 3);

    // Fase 2: Chiusura Impasto & Condimenti
    insertIng.run(1, 2, 'Acqua fredda residua', '152', 'ml', 'Per portare idratazione finale al 68%', 4);
    insertIng.run(1, 2, 'Sale marino fino integrale', '18', 'g', 'Da aggiungere a maglia glutinica parziale', 5);
    insertIng.run(1, 2, 'Malto diastasico in polvere', '4', 'g', 'Favorisce doratura e caramellizzazione', 6);
    insertIng.run(1, 2, 'Pomodori Pelati San Marzano DOP', '400', 'g', 'Schiacciati a mano con basilico', 7);
    insertIng.run(1, 2, 'Fior di latte / Mozzarella campana', '360', 'g', 'Tagliata a julienne spessa e scolata', 8);
    insertIng.run(1, 2, 'Olio Extravergine d Oliva e Basilico', '1', 'filo', 'A crudo prima di infornare', 9);

    // Procedure R1
    insertProc.run(1, 1, 1, 'Preparazione Biga: In una ciotola mescolare la farina, il lievito spezzettato e 290ml di acqua fredda per 2 minuti. La massa deve rimanere grezza e slegata.', null, 3);
    insertProc.run(1, 2, 1, 'Maturazione Biga: Porre la biga in contenitore ermetico leggermente unto e lasciare fermentare a 16-18°C per 16 ore.', null, 960);
    insertProc.run(1, 3, 2, 'Rinfresco Impasto: Spezzettare la biga in planetaria (o ciotola) con il malto e metà dell acqua residua (circa 75ml). Avviare a bassa velocità per rompere i grumi.', null, 5);
    insertProc.run(1, 4, 2, 'Incordatura & Idratazione: Aggiungere il sale e versare la restante acqua fredda a filo goccia a goccia fino ad ottenere un impasto lucido, elastico e setoso.', null, 12);
    insertProc.run(1, 5, 2, 'Puntata & Pieghe: Trasferire sul banco, fare 2 giri di pieghe a tre (slap & fold) e lasciare riposare coperto a campana per 30 minuti.', null, 30);
    insertProc.run(1, 6, 2, 'Staglio & Appretto: Porzionare in panetti da 270g l uno, chiudere bene a pallina (pirlatura) e riporre nelle cassette di lievitazione per 4 ore a temperatura ambiente (21-23°C).', null, 240);
    insertProc.run(1, 7, 2, 'Stesura & Cottura: Stendere con i polpastrelli dal centro verso l esterno lasciando 2cm di cornicione intatto. Farcire e cuocere in forno a 450-480°C per 75-90 secondi.', null, 2);

    // RICETTA 2: Pane Rustico Casereccio a Lievitazione Naturale (Parametrico)
    insertRecipe.run({
      id: 2,
      name: 'Pane Rustico a Lievitazione Naturale',
      slug: 'pane-rustico-lievitazione-naturale',
      category: 'Pani & Lievito Madre',
      category_id: 2,
      description: 'Pagnotta casereccia con crosta bruna e croccante, mollica morbida e aperta con 75% di idratazione e pasta madre attiva o licoli.',
      image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
      is_parametric: 1,
      calculator_name: 'Calcolatore Pagnotte (circa 800g cad.)',
      prep_time: 40,
      cook_time: 45,
      difficulty: 'Media'
    });

    insertPred.run(2, '1 Pagnotta (800g)', 1.0, 1);
    insertPred.run(2, '2 Pagnotte (1.6kg)', 2.0, 2);
    insertPred.run(2, '3 Pagnotte (Forno Pieno)', 3.0, 3);

    insertIng.run(2, 1, 'Farina Tipo 1 macinata a pietra (W280)', '400', 'g', 'Profumata e ricca di ceneri', 1);
    insertIng.run(2, 1, 'Farina di grano duro Senatore Cappelli', '100', 'g', 'Regala colore dorato e sapore rustico', 2);
    insertIng.run(2, 1, 'Acqua a temperatura ambiente (Autolisi)', '375', 'ml', '75% di idratazione totale', 3);
    insertIng.run(2, 2, 'Pasta Madre attiva (rinfrescata al raddoppio)', '100', 'g', 'Al picco di vitalità', 4);
    insertIng.run(2, 2, 'Sale marino fine', '11', 'g', '2.2% sul peso totale delle farine', 5);

    insertProc.run(2, 1, 1, 'Autolisi: Mescolare grossolanamente le due farine con 350ml di acqua. Coprire e lasciare in autolisi per 45 minuti per distendere il glutine.', null, 45);
    insertProc.run(2, 2, 2, 'Inserimento Lievito: Aggiungere il lievito madre all impasto autolitico e impastare per 4-5 minuti fino a completo assorbimento.', null, 5);
    insertProc.run(2, 3, 2, 'Salatura: Aggiungere il sale e gli ultimi 25ml di acqua. Lavorare energicamente con pieghe Rubaud fino a velo perfetto.', null, 8);
    insertProc.run(2, 4, 2, 'Pieghe di rinforzo in ciotola: Eseguire 3 serie di pieghe a distanza di 45 minuti l una dall altra durante la prima lievitazione.', null, 135);
    insertProc.run(2, 5, 2, 'Formatura & Cestino: Rovesciare sul banco, formare a pagnotta sferica o batard, e trasferire nel cestino di lievitazione (banneton) infarinato con semola.', null, 15);
    insertProc.run(2, 6, 2, 'Maturazione al freddo: Riporre il cestino sigillato in frigorifero a 4°C per 12-16 ore per sviluppare acidità lattica e aromi complessi.', null, 720);
    insertProc.run(2, 7, 2, 'Cottura in pentola di ghisa: Preriscaldare la pentola a 240°C. Ribaltare il pane, incidere con lametta a 45°. Cuocere con coperchio per 25 min, poi scoperto a 210°C per 20 min.', null, 45);

    // RICETTA 3: Tagliatelle all Uovo della Tradizione Emiliana (Parametrico per persone)
    insertRecipe.run({
      id: 3,
      name: 'Tagliatelle Emiliane Tradizionali',
      slug: 'tagliatelle-emiliane-tradizionali',
      category: 'Pasta Fresca & Primi',
      category_id: 3,
      description: 'La classica sfoglia tirata al matterello secondo la proporzione aurea bolognese: 1 uovo fresco per ogni 100g di farina di grano tenero.',
      image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80',
      is_parametric: 1,
      calculator_name: 'Calcolatore Porzioni Pasta',
      prep_time: 35,
      cook_time: 3,
      difficulty: 'Facile'
    });

    insertPred.run(3, '2 Porzioni', 0.5, 2);
    insertPred.run(3, '4 Porzioni (Famiglia)', 1.0, 4);
    insertPred.run(3, '6 Porzioni', 1.5, 6);
    insertPred.run(3, '8 Porzioni (Pranzo Domenicale)', 2.0, 8);

    insertIng.run(3, 1, 'Farina di grano tenero Tipo 00', '400', 'g', 'Setacciata a fontana sul tagliere in legno', 1);
    insertIng.run(3, 1, 'Uova fresche grandi a temperatura ambiente', '4', 'pz', 'Circa 60g ciascuna con guscio', 2);
    insertIng.run(3, 1, 'Semola rimacinata di grano duro', '30', 'g', 'Per lo spolvero della sfoglia', 3);
    insertIng.run(3, 1, 'Sale fino nell acqua di cottura', '35', 'g', 'Per 4 litri di acqua bollente', 4);

    insertProc.run(3, 1, 1, 'Fontana: Disporre la farina a vulcano sul tagliere in legno, rompere le uova al centro e sbattere con una forchetta incorporando gradualmente la farina dai bordi.', null, 5);
    insertProc.run(3, 2, 1, 'Impastamento: Lavorare con il palmo della mano per circa 10 minuti fino a creare un panetto liscio, compatto ed elastico.', null, 10);
    insertProc.run(3, 3, 1, 'Riposo: Avvolgere in pellicola trasparente e far riposare a temperatura ambiente per 30 minuti affinché il glutine si rilassi.', null, 30);
    insertProc.run(3, 4, 1, 'Stesura Sfoglia: Tirare la sfoglia al matterello ruotandola continuamente fino ad uno spessore di circa 0.6-0.8 mm (dovete intravedere il legno del tagliere).', null, 15);
    insertProc.run(3, 5, 1, 'Taglio & Nidi: Far asciugare la sfoglia per 10 minuti, arrotolarla delicatamente e tagliare le tagliatelle a larghezza di 7 mm. Formare i nidi spolverando con semola.', null, 10);
    insertProc.run(3, 6, 1, 'Cottura: Tuffare in abbondante acqua salata bollente per 2-3 minuti al dente.', null, 3);

    // RICETTA 4: Focaccia Genovese Classica (Fügassa)
    insertRecipe.run({
      id: 4,
      name: 'Focaccia Genovese Classica',
      slug: 'focaccia-genovese-classica',
      category: 'Pizze & Lievitati',
      category_id: 1,
      description: 'La vera focaccia ligure con la sua inconfondibile salamoia, morbida all interno e croccante con fossette dorate e profumate di olio EVO.',
      image_url: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=800&auto=format&fit=crop&q=80',
      is_parametric: 1,
      calculator_name: 'Calcolatore Teglie (30x40cm)',
      prep_time: 40,
      cook_time: 18,
      difficulty: 'Media'
    });

    insertPred.run(4, '1 Teglia (30x40 cm)', 1.0, 1);
    insertPred.run(4, '2 Teglie (60x40 cm)', 2.0, 2);

    insertIng.run(4, 1, 'Farina di grano tenero Tipo 0 (W260)', '500', 'g', 'Media forza', 1);
    insertIng.run(4, 1, 'Acqua tiepida (24°C)', '300', 'ml', '60% di idratazione', 2);
    insertIng.run(4, 1, 'Lievito di birra fresco', '15', 'g', 'Sciolto in parte dell acqua', 3);
    insertIng.run(4, 1, 'Olio Extravergine d Oliva Ligure (Impasto)', '30', 'ml', 'Delicato e fruttato', 4);
    insertIng.run(4, 1, 'Sale fino (Impasto)', '10', 'g', '2%', 5);
    insertIng.run(4, 1, 'Malto d orzo o zucchero', '5', 'g', 'Per doratura', 6);
    insertIng.run(4, 2, 'Acqua per salamoia', '65', 'ml', 'Emulsionata con olio', 7);
    insertIng.run(4, 2, 'Olio Extravergine d Oliva (Salamoia)', '45', 'ml', 'Per le fossette', 8);
    insertIng.run(4, 2, 'Sale grosso marino di Cervia', '8', 'g', 'Spolverato in superficie', 9);

    insertProc.run(4, 1, 1, 'Impasto: Impastare farina, acqua, malto e lievito sciolto. Quando la pasta prende corpo aggiungere sale e olio fino ad ottenere una pasta liscia ed elastica.', null, 10);
    insertProc.run(4, 2, 1, 'Prima Lievitazione: Lasciare riposare in ciotola coperta per 30 minuti.', null, 30);
    insertProc.run(4, 3, 1, 'Stesura in Teglia: Ungere la teglia con abbondante olio EVO. Posizionare il panetto e allargarlo delicatamente senza strappare.', null, 10);
    insertProc.run(4, 4, 1, 'Lievitazione intermedia: Lasciare lievitare coperto per 40 minuti a temperatura ambiente.', null, 40);
    insertProc.run(4, 5, 2, 'Salamoia & Impronte: Cospargere con sale grosso. Emulsionare acqua tiepida e olio EVO e versare sulla superficie. Affondare energicamente le dita per formare le caratteristiche fossette genovesi.', null, 5);
    insertProc.run(4, 6, 2, 'Ultima Lievitazione: Far lievitare per altri 60 minuti fino al raddoppio.', null, 60);
    insertProc.run(4, 7, 2, 'Cottura: Infornare a 230°C statico per 15-18 minuti fino a doratura uniforme.', null, 18);

    // RICETTA 5: Tiramisù Tradizionale al Mascarpone
    insertRecipe.run({
      id: 5,
      name: 'Tiramisù Artigianale Trevigiano',
      slug: 'tiramisu-artigianale-trevigiano',
      category: 'Pasticceria & Dolci',
      category_id: 4,
      description: 'Il celebre dessert veneto con crema vellutata di mascarpone e uova fresche, savoiardi friabili imbevuti di caffè espresso moka e cacao amaro olandese.',
      image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&auto=format&fit=crop&q=80',
      is_parametric: 1,
      calculator_name: 'Calcolatore Porzioni Tiramisù',
      prep_time: 25,
      cook_time: 0,
      difficulty: 'Facile'
    });

    insertPred.run(5, '4 Porzioni (Pirofila Piccola)', 0.67, 4);
    insertPred.run(5, '6 Porzioni [Standard]', 1.0, 6);
    insertPred.run(5, '8 Porzioni (Pirofila Grande)', 1.33, 8);
    insertPred.run(5, '12 Porzioni (Buffet/Festa)', 2.0, 12);

    insertIng.run(5, 1, 'Mascarpone freschissimo artigianale', '500', 'g', 'Cremoso e denso', 1);
    insertIng.run(5, 1, 'Uova freschissime a temperatura ambiente', '4', 'pz', 'Tuorli e albumi separati', 2);
    insertIng.run(5, 1, 'Zucchero semolato fine', '100', 'g', 'Per montare i tuorli', 3);
    insertIng.run(5, 1, 'Biscotti Savoiardi di qualità', '300', 'g', 'Friabili e zuccherati', 4);
    insertIng.run(5, 1, 'Caffè espresso da moka amaro', '300', 'ml', 'Freddo a temperatura ambiente', 5);
    insertIng.run(5, 1, 'Cacao amaro in polvere 100%', '25', 'g', 'Per la spolverata finale', 6);

    insertProc.run(5, 1, 1, 'Crema Tuorli: Montare i tuorli con lo zucchero con le fruste elettriche per almeno 5-7 minuti fino ad ottenere una massa chiara, spumosa e gonfia.', null, 7);
    insertProc.run(5, 2, 1, 'Inserimento Mascarpone: Lavorare brevemente il mascarpone con una spatola per ammorbidirlo, quindi incorporarlo delicatamente alla crema di tuorli con movimenti dal basso verso l alto.', null, 5);
    insertProc.run(5, 3, 1, 'Albumi a Neve: Montare gli albumi a neve ben ferma e incorporarli alla crema con estrema delicatezza per non smontare il composto.', null, 6);
    insertProc.run(5, 4, 1, 'Assemblaggio: Inzuppare velocemente i savoiardi nel caffè amaro e disporre un primo strato ordinato sul fondo della pirofila. Coprire con metà della crema al mascarpone.', null, 8);
    insertProc.run(5, 5, 1, 'Secondo Strato & Riposo: Ripetere con un secondo strato di savoiardi inzuppati e finire con la restante crema livellando con una spatola.', null, 5);
    insertProc.run(5, 6, 1, 'Raffreddamento in Frigorifero: Porre in frigo a 4°C per almeno 4 ore (meglio tutta la notte) per compattare la crema. Spolverare generosamente di cacao prima di servire.', null, 240);
  }

  // --------------------------------------------------------------------------
  // API ROUTES AN DA
  // --------------------------------------------------------------------------

  // 1. Overview & Statistiche AnDa
  router.get('/overview', (req: Request, res: Response) => {
    try {
      const totalRecipes = (db.prepare('SELECT COUNT(*) as c FROM recipes').get() as any).c;
      const parametricRecipes = (db.prepare('SELECT COUNT(*) as c FROM recipes WHERE is_parametric = 1').get() as any).c;
      const totalCategories = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as any).c;

      const categories = db.prepare(`
        SELECT c.*, COUNT(r.id) as recipe_count
        FROM categories c
        LEFT JOIN recipes r ON r.category_id = c.id
        GROUP BY c.id
        ORDER BY c.sort_order ASC, c.name ASC
      `).all();

      const recentRecipes = db.prepare(`
        SELECT r.*, c.name as category_name, c.icon as category_icon, c.slug as category_slug,
               (SELECT COUNT(*) FROM ingredients WHERE recipe_id = r.id) as ingredients_count,
               (SELECT COUNT(*) FROM procedures WHERE recipe_id = r.id) as procedures_count
        FROM recipes r
        LEFT JOIN categories c ON r.category_id = c.id
        ORDER BY r.created_at DESC
        LIMIT 6
      `).all();

      res.json({
        totalRecipes,
        parametricRecipes,
        totalCategories,
        categories,
        recentRecipes
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Categorie CRUD
  router.get('/categories', (req: Request, res: Response) => {
    try {
      const categories = db.prepare(`
        SELECT c.*, COUNT(r.id) as recipe_count
        FROM categories c
        LEFT JOIN recipes r ON r.category_id = c.id
        GROUP BY c.id
        ORDER BY c.sort_order ASC, c.name ASC
      `).all();
      res.json(categories);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/categories', (req: Request, res: Response) => {
    try {
      const { name, description, icon, sort_order } = req.body;
      if (!name) return res.status(400).json({ error: 'Il nome categoria è obbligatorio' });

      const slug = slugify(name);
      const stmt = db.prepare(`
        INSERT INTO categories (name, slug, description, icon, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `);
      const info = stmt.run(name.trim(), slug, description || '', icon || 'Utensils', sort_order || 0);

      const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/categories/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, description, icon, sort_order } = req.body;
      if (!name) return res.status(400).json({ error: 'Il nome categoria è obbligatorio' });

      const slug = slugify(name);
      db.prepare(`
        UPDATE categories
        SET name = ?, slug = ?, description = ?, icon = ?, sort_order = ?
        WHERE id = ?
      `).run(name.trim(), slug, description || '', icon || 'Utensils', sort_order || 0, id);

      const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/categories/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
      res.json({ ok: true, message: 'Categoria eliminata con successo' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Ricette CRUD
  router.get('/recipes', (req: Request, res: Response) => {
    try {
      const { category_id, category_slug, search, parametric } = req.query;

      let sql = `
        SELECT r.*, c.name as category_name, c.icon as category_icon, c.slug as category_slug,
               (SELECT COUNT(*) FROM ingredients WHERE recipe_id = r.id) as ingredients_count,
               (SELECT COUNT(*) FROM procedures WHERE recipe_id = r.id) as procedures_count
        FROM recipes r
        LEFT JOIN categories c ON r.category_id = c.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (category_id) {
        sql += ' AND r.category_id = ?';
        params.push(category_id);
      } else if (category_slug && category_slug !== 'all') {
        sql += ' AND c.slug = ?';
        params.push(category_slug);
      }

      if (search) {
        sql += ' AND (r.name LIKE ? OR r.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (parametric !== undefined && parametric !== '') {
        sql += ' AND r.is_parametric = ?';
        params.push(Number(parametric));
      }

      sql += ' ORDER BY r.updated_at DESC, r.name ASC';

      const recipes = db.prepare(sql).all(...params);
      res.json(recipes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dettaglio Singola Ricetta (con ingredienti, procedure, moltiplicatori)
  router.get('/recipes/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const recipe = db.prepare(`
        SELECT r.*, c.name as category_name, c.icon as category_icon, c.slug as category_slug
        FROM recipes r
        LEFT JOIN categories c ON r.category_id = c.id
        WHERE r.id = ?
      `).get(id) as any;

      if (!recipe) {
        return res.status(404).json({ error: 'Ricetta non trovata' });
      }

      const ingredients = db.prepare(`
        SELECT * FROM ingredients 
        WHERE recipe_id = ? 
        ORDER BY phase ASC, sort_order ASC, id ASC
      `).all(id);

      const procedures = db.prepare(`
        SELECT * FROM procedures 
        WHERE recipe_id = ? 
        ORDER BY phase ASC, step_number ASC, id ASC
      `).all(id);

      const predefined_quantities = db.prepare(`
        SELECT * FROM predefined_quantities 
        WHERE recipe_id = ? 
        ORDER BY multiplier ASC
      `).all(id);

      res.json({
        ...recipe,
        ingredients,
        procedures,
        predefined_quantities
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Salva Nuova Ricetta (con transazione completa)
  router.post('/recipes', (req: Request, res: Response) => {
    try {
      const {
        name,
        category_id,
        description,
        image_url,
        is_parametric,
        calculator_name,
        prep_time,
        cook_time,
        difficulty,
        ingredients = [],
        procedures = [],
        predefined_quantities = []
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Il nome della ricetta è obbligatorio' });
      }

      const slug = slugify(name) + '-' + Date.now().toString().slice(-4);

      let catName = '';
      if (category_id) {
        const cat = db.prepare('SELECT name FROM categories WHERE id = ?').get(category_id) as any;
        if (cat) catName = cat.name;
      }

      let newRecipeId = 0;

      const tx = db.transaction(() => {
        const insertR = db.prepare(`
          INSERT INTO recipes (
            name, slug, category, category_id, description, image_url,
            is_parametric, calculator_name, prep_time, cook_time, difficulty
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insertR.run(
          name.trim(),
          slug,
          catName,
          category_id || null,
          description || '',
          image_url || '',
          is_parametric ? 1 : 0,
          calculator_name || (is_parametric ? 'Calcolatore Dosi' : null),
          prep_time || 0,
          cook_time || 0,
          difficulty || 'Media'
        );

        newRecipeId = Number(result.lastInsertRowid);

        if (Array.isArray(ingredients) && ingredients.length > 0) {
          const insertIng = db.prepare(`
            INSERT INTO ingredients (recipe_id, phase, name, quantity, unit, notes, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          ingredients.forEach((ing: any, idx: number) => {
            if (ing.name && ing.name.trim()) {
              insertIng.run(
                newRecipeId,
                ing.phase || 1,
                ing.name.trim(),
                ing.quantity ? String(ing.quantity) : '',
                ing.unit || '',
                ing.notes || '',
                ing.sort_order ?? idx + 1
              );
            }
          });
        }

        if (Array.isArray(procedures) && procedures.length > 0) {
          const insertProc = db.prepare(`
            INSERT INTO procedures (recipe_id, step_number, phase, description, image_url, timer_minutes)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          procedures.forEach((proc: any, idx: number) => {
            if (proc.description && proc.description.trim()) {
              insertProc.run(
                newRecipeId,
                proc.step_number ?? idx + 1,
                proc.phase || 1,
                proc.description.trim(),
                proc.image_url || '',
                proc.timer_minutes || null
              );
            }
          });
        }

        if (Array.isArray(predefined_quantities) && predefined_quantities.length > 0) {
          const insertPred = db.prepare(`
            INSERT INTO predefined_quantities (recipe_id, quantity_name, multiplier, base_value)
            VALUES (?, ?, ?, ?)
          `);
          predefined_quantities.forEach((pred: any) => {
            if (pred.quantity_name && pred.quantity_name.trim()) {
              insertPred.run(
                newRecipeId,
                pred.quantity_name.trim(),
                Number(pred.multiplier) || 1.0,
                Number(pred.base_value) || 1
              );
            }
          });
        }
      });

      tx();

      // Return created object
      const created = db.prepare('SELECT * FROM recipes WHERE id = ?').get(newRecipeId);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Aggiorna Ricetta Esistente
  router.put('/recipes/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const {
        name,
        category_id,
        description,
        image_url,
        is_parametric,
        calculator_name,
        prep_time,
        cook_time,
        difficulty,
        ingredients,
        procedures,
        predefined_quantities
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Il nome della ricetta è obbligatorio' });
      }

      let catName = '';
      if (category_id) {
        const cat = db.prepare('SELECT name FROM categories WHERE id = ?').get(category_id) as any;
        if (cat) catName = cat.name;
      }

      const tx = db.transaction(() => {
        db.prepare(`
          UPDATE recipes
          SET name = ?, category = ?, category_id = ?, description = ?, image_url = ?,
              is_parametric = ?, calculator_name = ?, prep_time = ?, cook_time = ?, difficulty = ?
          WHERE id = ?
        `).run(
          name.trim(),
          catName,
          category_id || null,
          description || '',
          image_url || '',
          is_parametric ? 1 : 0,
          calculator_name || (is_parametric ? 'Calcolatore Dosi' : null),
          prep_time || 0,
          cook_time || 0,
          difficulty || 'Media',
          id
        );

        if (Array.isArray(ingredients)) {
          db.prepare('DELETE FROM ingredients WHERE recipe_id = ?').run(id);
          const insertIng = db.prepare(`
            INSERT INTO ingredients (recipe_id, phase, name, quantity, unit, notes, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          ingredients.forEach((ing: any, idx: number) => {
            if (ing.name && ing.name.trim()) {
              insertIng.run(
                id,
                ing.phase || 1,
                ing.name.trim(),
                ing.quantity ? String(ing.quantity) : '',
                ing.unit || '',
                ing.notes || '',
                ing.sort_order ?? idx + 1
              );
            }
          });
        }

        if (Array.isArray(procedures)) {
          db.prepare('DELETE FROM procedures WHERE recipe_id = ?').run(id);
          const insertProc = db.prepare(`
            INSERT INTO procedures (recipe_id, step_number, phase, description, image_url, timer_minutes)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          procedures.forEach((proc: any, idx: number) => {
            if (proc.description && proc.description.trim()) {
              insertProc.run(
                id,
                proc.step_number ?? idx + 1,
                proc.phase || 1,
                proc.description.trim(),
                proc.image_url || '',
                proc.timer_minutes || null
              );
            }
          });
        }

        if (Array.isArray(predefined_quantities)) {
          db.prepare('DELETE FROM predefined_quantities WHERE recipe_id = ?').run(id);
          const insertPred = db.prepare(`
            INSERT INTO predefined_quantities (recipe_id, quantity_name, multiplier, base_value)
            VALUES (?, ?, ?, ?)
          `);
          predefined_quantities.forEach((pred: any) => {
            if (pred.quantity_name && pred.quantity_name.trim()) {
              insertPred.run(
                id,
                pred.quantity_name.trim(),
                Number(pred.multiplier) || 1.0,
                Number(pred.base_value) || 1
              );
            }
          });
        }
      });

      tx();

      const updated = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Elimina Ricetta
  router.delete('/recipes/:id', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      db.prepare('DELETE FROM recipes WHERE id = ?').run(id);
      res.json({ ok: true, message: 'Ricetta eliminata con successo' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Calcolo Parametrico dosi ingredienti
  router.post('/recipes/:id/scale', (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { multiplier = 1.0 } = req.body;
      const mult = Number(multiplier) || 1.0;

      const ingredients = db.prepare(`
        SELECT * FROM ingredients 
        WHERE recipe_id = ? 
        ORDER BY phase ASC, sort_order ASC, id ASC
      `).all(id) as any[];

      const scaledIngredients = ingredients.map((ing) => {
        const rawQty = (ing.quantity || '').trim().replace(',', '.');
        const numVal = parseFloat(rawQty);

        if (!isNaN(numVal) && isFinite(numVal)) {
          const scaledNum = Math.round(numVal * mult * 100) / 100;
          return {
            ...ing,
            original_quantity: ing.quantity,
            scaled_quantity: scaledNum % 1 === 0 ? String(scaledNum) : String(scaledNum.toFixed(1))
          };
        }

        return {
          ...ing,
          original_quantity: ing.quantity,
          scaled_quantity: ing.quantity
        };
      });

      res.json({
        recipe_id: id,
        multiplier: mult,
        ingredients: scaledIngredients
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
