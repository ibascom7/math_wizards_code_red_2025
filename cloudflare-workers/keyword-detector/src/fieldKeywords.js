/**
 * Field-specific keywords for STEM domains
 * Used to determine field relevance of search results
 * Covers Mathematics, Computer Science, Physics, Chemistry, Biology, and Engineering
 */

/**
 * Keywords database organized by STEM field
 * Each field contains an array of relevant terms and concepts
 * @type {Object.<string, string[]>}
 */
export const FIELD_KEYWORDS = {
  // ========== MATHEMATICS ==========
  'group theory': [
    'group', 'subgroup', 'homomorphism', 'isomorphism', 'automorphism',
    'normal subgroup', 'quotient group', 'coset', 'lagrange',
    'sylow', 'abelian', 'cyclic', 'permutation', 'symmetric group',
    'dihedral', 'free group', 'presentation', 'generator', 'relation',
    'group action', 'orbit', 'stabilizer', 'conjugacy', 'centralizer',
    'normalizer', 'composition series', 'simple group', 'solvable',
    'nilpotent', 'p-group', 'group extension', 'semidirect product'
  ],

  'topology': [
    'topological space', 'open set', 'closed set', 'neighborhood',
    'metric space', 'hausdorff', 'compact', 'connected', 'continuous',
    'homeomorphism', 'homotopy', 'fundamental group', 'homology',
    'cohomology', 'manifold', 'covering space', 'fiber bundle',
    'simplicial complex', 'CW complex', 'path', 'loop', 'contractible',
    'simply connected', 'universal cover', 'quotient space',
    'product topology', 'subspace topology', 'basis', 'subbasis',
    'separation axiom', 'normal space', 'regular space', 'metrizable',
    'embedding', 'retraction', 'deformation retract'
  ],

  'differential geometry': [
    'manifold', 'smooth manifold', 'tangent space', 'cotangent space',
    'vector field', 'differential form', 'tensor', 'metric tensor',
    'riemannian manifold', 'curvature', 'geodesic', 'connection',
    'covariant derivative', 'lie derivative', 'exterior derivative',
    'wedge product', 'pushforward', 'pullback', 'immersion', 'submersion',
    'embedding', 'bundle', 'section', 'fiber bundle', 'principal bundle',
    'vector bundle', 'lie group', 'lie algebra', 'killing form',
    'exponential map', 'parallel transport', 'holonomy', 'torsion',
    'ricci curvature', 'scalar curvature', 'gauss-bonnet', 'chern class'
  ],

  'algebra': [
    'ring', 'field', 'module', 'ideal', 'homomorphism', 'polynomial',
    'algebraic structure', 'vector space', 'linear transformation',
    'basis', 'dimension', 'rank', 'kernel', 'image', 'eigenvalue',
    'eigenvector', 'determinant', 'trace', 'characteristic polynomial',
    'jordan form', 'matrix', 'linear algebra', 'bilinear form',
    'quadratic form', 'inner product', 'orthogonal', 'unitary',
    'hermitian', 'galois theory', 'field extension', 'algebraic closure',
    'commutative algebra', 'prime ideal', 'maximal ideal', 'localization',
    'noetherian', 'artinian', 'integral domain', 'unique factorization'
  ],

  'analysis': [
    'limit', 'continuity', 'derivative', 'integral', 'convergence',
    'sequence', 'series', 'uniform convergence', 'pointwise convergence',
    'cauchy sequence', 'complete', 'metric space', 'normed space',
    'banach space', 'hilbert space', 'bounded', 'compact', 'dense',
    'measure', 'measurable', 'lebesgue integral', 'measure theory',
    'probability measure', 'borel set', 'sigma algebra', 'integration',
    'fourier series', 'fourier transform', 'functional', 'operator',
    'linear operator', 'bounded operator', 'spectrum', 'eigenspace',
    'weak convergence', 'strong convergence', 'l-p space', 'sobolev space',
    'distribution', 'tempered distribution', 'convolution', 'regularity'
  ],

  'number theory': [
    'prime', 'divisibility', 'gcd', 'lcm', 'congruence', 'modular arithmetic',
    'diophantine equation', 'quadratic reciprocity', 'euler totient',
    'fermat little theorem', 'chinese remainder theorem', 'primitive root',
    'quadratic residue', 'legendre symbol', 'jacobi symbol',
    'continued fraction', 'pell equation', 'algebraic number',
    'transcendental', 'cyclotomic field', 'class number', 'unit group',
    'dedekind domain', 'ideal class group', 'ramification', 'splitting',
    'l-function', 'zeta function', 'riemann hypothesis', 'prime number theorem',
    'elliptic curve', 'modular form', 'automorphic form'
  ],

  'category theory': [
    'category', 'functor', 'natural transformation', 'morphism',
    'object', 'arrow', 'composition', 'identity', 'isomorphism',
    'monomorphism', 'epimorphism', 'product', 'coproduct', 'limit',
    'colimit', 'adjoint', 'universal property', 'yoneda lemma',
    'representable functor', 'monad', 'comonad', 'abelian category',
    'exact sequence', 'kernel', 'cokernel', 'image', 'pullback',
    'pushout', 'equalizer', 'coequalizer', 'topos', 'sheaf',
    'presheaf', 'grothendieck topology', 'cartesian closed'
  ],

  'algebraic topology': [
    'homotopy', 'fundamental group', 'covering space', 'homology',
    'cohomology', 'singular homology', 'simplicial homology',
    'cellular homology', 'de rham cohomology', 'exact sequence',
    'mayer-vietoris', 'universal coefficient theorem', 'kunneth formula',
    'euler characteristic', 'betti number', 'homology group',
    'cohomology ring', 'cup product', 'cap product', 'poincare duality',
    'lefschetz fixed point', 'degree', 'winding number', 'index',
    'characteristic class', 'chern class', 'stiefel-whitney class',
    'pontryagin class', 'spectral sequence', 'fibration', 'cofibration'
  ],

  'logic': [
    'proposition', 'predicate', 'quantifier', 'proof', 'theorem',
    'axiom', 'inference rule', 'tautology', 'contradiction',
    'satisfiability', 'validity', 'soundness', 'completeness',
    'model', 'interpretation', 'first-order logic', 'higher-order logic',
    'modal logic', 'temporal logic', 'intuitionistic logic',
    'set theory', 'zfc', 'axiom of choice', 'continuum hypothesis',
    'ordinal', 'cardinal', 'transfinite induction', 'forcing',
    'consistency', 'independence', 'godel incompleteness',
    'recursion theory', 'turing machine', 'decidability', 'computability'
  ],

  'combinatorics': [
    'permutation', 'combination', 'binomial coefficient', 'generating function',
    'recurrence relation', 'partition', 'graph', 'tree', 'path', 'cycle',
    'coloring', 'chromatic number', 'matching', 'perfect matching',
    'hall marriage theorem', 'ramsey theory', 'pigeonhole principle',
    'inclusion-exclusion', 'mobius inversion', 'poset', 'lattice',
    'boolean algebra', 'design theory', 'block design', 'steiner system',
    'coding theory', 'error-correcting code', 'hamming distance',
    'linear code', 'cyclic code', 'enumeration', 'polya enumeration',
    'stirling number', 'catalan number', 'fibonacci', 'bell number'
  ],

  // ========== COMPUTER SCIENCE ==========

  'algorithms & data structures': [
    'algorithm', 'complexity', 'data structure', 'sorting', 'searching',
    'graph algorithm', 'tree', 'binary tree', 'hash table', 'heap',
    'stack', 'queue', 'linked list', 'array', 'dynamic programming',
    'greedy algorithm', 'divide and conquer', 'backtracking', 'recursion',
    'time complexity', 'space complexity', 'big O', 'asymptotic analysis',
    'NP-complete', 'NP-hard', 'polynomial time', 'breadth-first search',
    'depth-first search', 'shortest path', 'minimum spanning tree',
    'topological sort', 'dynamic array', 'balanced tree', 'AVL tree',
    'red-black tree', 'B-tree', 'trie', 'suffix tree'
  ],

  'machine learning': [
    'neural network', 'deep learning', 'supervised learning', 'unsupervised learning',
    'reinforcement learning', 'training', 'testing', 'validation', 'model',
    'dataset', 'feature', 'label', 'classification', 'regression',
    'clustering', 'gradient descent', 'backpropagation', 'activation function',
    'convolutional neural network', 'recurrent neural network', 'transformer',
    'attention mechanism', 'overfitting', 'underfitting', 'regularization',
    'dropout', 'batch normalization', 'loss function', 'optimizer',
    'hyperparameter', 'cross-validation', 'precision', 'recall', 'F1 score',
    'support vector machine', 'decision tree', 'random forest', 'k-means',
    'principal component analysis', 'dimensionality reduction'
  ],

  'operating systems': [
    'operating system', 'kernel', 'thread', 'process', 'scheduling',
    'context switch', 'memory management', 'virtual memory', 'paging',
    'segmentation', 'cache', 'TLB', 'page table', 'memory hierarchy',
    'file system', 'inode', 'disk scheduling', 'deadlock', 'semaphore',
    'mutex', 'synchronization', 'race condition', 'critical section',
    'interrupt', 'system call', 'user space', 'kernel space', 'device driver',
    'buffer', 'I/O scheduling', 'CPU scheduling', 'priority scheduling',
    'round robin', 'multiprocessing', 'multithreading', 'concurrency'
  ],

  'programming languages': [
    'compiler', 'interpreter', 'syntax', 'semantics', 'lexical analysis',
    'parsing', 'type system', 'type checking', 'type inference',
    'garbage collection', 'memory management', 'runtime', 'bytecode',
    'abstract syntax tree', 'intermediate representation', 'optimization',
    'code generation', 'static analysis', 'dynamic analysis',
    'functional programming', 'object-oriented programming', 'imperative',
    'declarative', 'lambda calculus', 'closure', 'higher-order function',
    'polymorphism', 'inheritance', 'encapsulation', 'abstraction',
    'concurrency', 'parallelism', 'immutability', 'recursion'
  ],

  'databases': [
    'database', 'SQL', 'NoSQL', 'relational database', 'transaction',
    'ACID', 'atomicity', 'consistency', 'isolation', 'durability',
    'indexing', 'B-tree index', 'hash index', 'query optimization',
    'query plan', 'join', 'inner join', 'outer join', 'aggregation',
    'normalization', 'denormalization', 'primary key', 'foreign key',
    'schema', 'table', 'column', 'row', 'view', 'stored procedure',
    'trigger', 'concurrency control', 'locking', 'two-phase commit',
    'replication', 'sharding', 'partitioning', 'CAP theorem',
    'eventual consistency', 'document database', 'key-value store',
    'graph database', 'time-series database'
  ],

  // ========== PHYSICS ==========

  'classical mechanics': [
    'force', 'momentum', 'energy', 'newton', 'motion', 'kinematics',
    'dynamics', 'velocity', 'acceleration', 'mass', 'inertia',
    'conservation of energy', 'conservation of momentum', 'work',
    'power', 'torque', 'angular momentum', 'rotation', 'gravitation',
    'friction', 'harmonic oscillator', 'simple harmonic motion',
    'pendulum', 'center of mass', 'moment of inertia', 'rigid body',
    'collision', 'elastic collision', 'inelastic collision',
    'lagrangian mechanics', 'hamiltonian mechanics', 'action principle',
    'phase space', 'canonical coordinates'
  ],

  'quantum mechanics': [
    'quantum', 'wavefunction', 'eigenstate', 'eigenvalue', 'operator',
    'observable', 'measurement', 'uncertainty principle', 'superposition',
    'entanglement', 'quantum state', 'hilbert space', 'hermitian operator',
    'commutator', 'schrodinger equation', 'time evolution', 'hamiltonian',
    'quantum number', 'spin', 'pauli matrices', 'angular momentum',
    'orbital', 'electron', 'photon', 'particle', 'wave-particle duality',
    'quantum field theory', 'creation operator', 'annihilation operator',
    'fock space', 'second quantization', 'perturbation theory',
    'density matrix', 'mixed state', 'pure state'
  ],

  'thermodynamics': [
    'entropy', 'temperature', 'heat', 'energy', 'equilibrium',
    'statistical mechanics', 'partition function', 'free energy',
    'internal energy', 'enthalpy', 'gibbs free energy', 'helmholtz free energy',
    'first law', 'second law', 'third law', 'zeroth law',
    'reversible process', 'irreversible process', 'carnot cycle',
    'heat engine', 'refrigerator', 'heat pump', 'efficiency',
    'phase transition', 'critical point', 'phase diagram',
    'boltzmann distribution', 'maxwell-boltzmann', 'fermi-dirac',
    'bose-einstein', 'microstate', 'macrostate', 'ensemble'
  ],

  'electromagnetism': [
    'electric field', 'magnetic field', 'maxwell equations', 'electromagnetic wave',
    'charge', 'current', 'voltage', 'resistance', 'capacitance',
    'inductance', 'coulomb law', 'gauss law', 'ampere law', 'faraday law',
    'lorentz force', 'electromagnetic induction', 'displacement current',
    'poynting vector', 'electromagnetic radiation', 'polarization',
    'electric potential', 'magnetic potential', 'vector potential',
    'electric dipole', 'magnetic dipole', 'multipole expansion',
    'waveguide', 'transmission line', 'antenna', 'electromagnetic field',
    'field strength', 'flux', 'circulation'
  ],

  'relativity': [
    'spacetime', 'lorentz transformation', 'einstein', 'relativistic',
    'special relativity', 'general relativity', 'metric tensor',
    'time dilation', 'length contraction', 'simultaneity',
    'four-vector', 'minkowski space', 'proper time', 'worldline',
    'light cone', 'causality', 'spacetime interval', 'invariant',
    'covariant', 'contravariant', 'tensor', 'curvature',
    'riemann tensor', 'ricci tensor', 'einstein equation',
    'schwarzschild metric', 'geodesic', 'gravitational field',
    'equivalence principle', 'black hole', 'event horizon',
    'gravitational wave', 'cosmology'
  ],

  // ========== CHEMISTRY ==========

  'organic chemistry': [
    'organic', 'hydrocarbon', 'functional group', 'alkane', 'alkene', 'alkyne',
    'aromatic', 'benzene', 'reaction mechanism', 'nucleophile', 'electrophile',
    'substitution', 'elimination', 'addition', 'oxidation', 'reduction',
    'synthesis', 'retrosynthesis', 'stereochemistry', 'chirality', 'enantiomer',
    'diastereomer', 'conformational analysis', 'carbon', 'bond',
    'covalent bond', 'conjugation', 'resonance', 'carbocation', 'carbanion',
    'radical', 'alcohol', 'aldehyde', 'ketone', 'carboxylic acid',
    'ester', 'ether', 'amine', 'amide', 'peptide'
  ],

  'inorganic chemistry': [
    'inorganic', 'coordination compound', 'ligand', 'metal complex',
    'crystal field theory', 'ligand field theory', 'coordination number',
    'crystal structure', 'lattice', 'unit cell', 'transition metal',
    'oxidation state', 'd-orbital', 'f-orbital', 'lanthanide', 'actinide',
    'main group', 'periodic table', 'ionic bond', 'metallic bond',
    'coordination geometry', 'octahedral', 'tetrahedral', 'square planar',
    'organometallic', 'cluster', 'solid state', 'band theory',
    'semiconductor', 'superconductor', 'magnetic property', 'bioinorganic'
  ],

  'physical chemistry': [
    'thermodynamics', 'kinetics', 'equilibrium', 'quantum chemistry',
    'spectroscopy', 'rate law', 'rate constant', 'activation energy',
    'arrhenius equation', 'transition state theory', 'reaction coordinate',
    'chemical potential', 'activity', 'fugacity', 'phase equilibrium',
    'colligative property', 'raoult law', 'henry law',
    'electrochemistry', 'electrode potential', 'nernst equation',
    'galvanic cell', 'electrolysis', 'molecular orbital theory',
    'HOMO', 'LUMO', 'valence bond theory', 'hybridization',
    'IR spectroscopy', 'NMR spectroscopy', 'UV-vis spectroscopy',
    'mass spectrometry', 'photochemistry', 'quantum yield'
  ],

  'biochemistry': [
    'protein', 'enzyme', 'DNA', 'RNA', 'nucleic acid', 'amino acid',
    'peptide bond', 'protein structure', 'primary structure', 'secondary structure',
    'tertiary structure', 'quaternary structure', 'alpha helix', 'beta sheet',
    'metabolism', 'catabolism', 'anabolism', 'glycolysis', 'krebs cycle',
    'electron transport chain', 'ATP', 'phosphorylation', 'enzyme kinetics',
    'michaelis-menten', 'allosteric regulation', 'feedback inhibition',
    'substrate', 'active site', 'cofactor', 'coenzyme', 'vitamin',
    'lipid', 'carbohydrate', 'nucleotide', 'base pair', 'replication',
    'transcription', 'translation', 'gene expression', 'protein folding'
  ],

  // ========== BIOLOGY ==========

  'molecular biology': [
    'DNA', 'RNA', 'protein', 'gene', 'genome', 'chromosome',
    'transcription', 'translation', 'replication', 'mutation',
    'genetic code', 'codon', 'anticodon', 'ribosome', 'mRNA', 'tRNA', 'rRNA',
    'promoter', 'enhancer', 'transcription factor', 'RNA polymerase',
    'splicing', 'intron', 'exon', 'DNA polymerase', 'helicase', 'ligase',
    'restriction enzyme', 'PCR', 'cloning', 'sequencing', 'gene editing',
    'CRISPR', 'plasmid', 'vector', 'transformation', 'recombinant DNA',
    'base pair', 'nucleotide', 'double helix', 'complementary', 'template strand'
  ],

  'cell biology': [
    'cell', 'membrane', 'organelle', 'nucleus', 'cytoplasm', 'mitochondria',
    'chloroplast', 'endoplasmic reticulum', 'golgi apparatus', 'lysosome',
    'ribosome', 'cytoskeleton', 'cell wall', 'plasma membrane',
    'phospholipid bilayer', 'membrane protein', 'channel', 'receptor',
    'cell division', 'mitosis', 'meiosis', 'cell cycle', 'interphase',
    'prophase', 'metaphase', 'anaphase', 'telophase', 'cytokinesis',
    'cell signaling', 'signal transduction', 'second messenger',
    'apoptosis', 'differentiation', 'stem cell', 'tissue', 'organ'
  ],

  'genetics': [
    'gene', 'allele', 'chromosome', 'DNA', 'mutation', 'heredity',
    'genotype', 'phenotype', 'dominant', 'recessive', 'codominance',
    'incomplete dominance', 'mendel', 'punnett square', 'cross',
    'inheritance', 'linkage', 'recombination', 'crossing over',
    'genetic map', 'locus', 'homozygous', 'heterozygous', 'diploid', 'haploid',
    'sex-linked', 'X-linked', 'Y-linked', 'autosomal', 'pedigree',
    'genetic disorder', 'population genetics', 'allele frequency',
    'hardy-weinberg equilibrium', 'genetic drift', 'gene flow',
    'epistasis', 'pleiotropy', 'polygenic'
  ],

  'evolution': [
    'natural selection', 'evolution', 'adaptation', 'species', 'darwin',
    'fitness', 'survival of the fittest', 'common ancestor', 'phylogeny',
    'phylogenetic tree', 'cladistics', 'homology', 'analogy',
    'convergent evolution', 'divergent evolution', 'coevolution',
    'speciation', 'allopatric', 'sympatric', 'reproductive isolation',
    'genetic variation', 'mutation', 'genetic drift', 'gene flow',
    'population', 'allele frequency', 'microevolution', 'macroevolution',
    'fossil record', 'vestigial structure', 'molecular evolution',
    'molecular clock', 'biogeography', 'comparative anatomy'
  ],

  'ecology': [
    'ecosystem', 'population', 'community', 'biodiversity', 'habitat',
    'niche', 'food web', 'food chain', 'trophic level', 'producer',
    'consumer', 'decomposer', 'herbivore', 'carnivore', 'omnivore',
    'predator', 'prey', 'symbiosis', 'mutualism', 'commensalism', 'parasitism',
    'competition', 'predation', 'carrying capacity', 'population dynamics',
    'exponential growth', 'logistic growth', 'limiting factor',
    'succession', 'primary succession', 'secondary succession', 'climax community',
    'biome', 'carbon cycle', 'nitrogen cycle', 'water cycle', 'energy flow',
    'pyramid of energy', 'pyramid of biomass', 'conservation', 'endangered species'
  ],

  // ========== ENGINEERING ==========

  'electrical engineering': [
    'circuit', 'voltage', 'current', 'resistance', 'capacitor', 'inductor',
    'transistor', 'diode', 'amplifier', 'operational amplifier', 'op-amp',
    'filter', 'oscillator', 'rectifier', 'power supply', 'transformer',
    'AC circuit', 'DC circuit', 'impedance', 'reactance', 'resonance',
    'phasor', 'frequency response', 'transfer function', 'bode plot',
    'feedback', 'control system', 'analog circuit', 'digital circuit',
    'logic gate', 'flip-flop', 'microprocessor', 'microcontroller',
    'FPGA', 'signal processing', 'modulation', 'demodulation', 'antenna',
    'electromagnetic compatibility', 'power electronics', 'motor drive'
  ],

  'mechanical engineering': [
    'stress', 'strain', 'material', 'mechanics of materials', 'solid mechanics',
    'fluid mechanics', 'fluid dynamics', 'thermodynamics', 'heat transfer',
    'conduction', 'convection', 'radiation', 'mass transfer', 'diffusion',
    'statics', 'dynamics', 'kinematics', 'kinetics', 'vibration',
    'machine design', 'mechanism', 'gear', 'bearing', 'shaft',
    'fatigue', 'fracture', 'failure analysis', 'finite element analysis', 'FEA',
    'CAD', 'manufacturing', 'machining', 'casting', 'welding',
    'material properties', 'yield strength', 'tensile strength', 'elastic modulus',
    'thermal expansion', 'coefficient of friction'
  ],

  'civil engineering': [
    'structure', 'structural engineering', 'structural analysis', 'beam',
    'column', 'truss', 'frame', 'load', 'dead load', 'live load',
    'wind load', 'seismic load', 'foundation', 'footing', 'pile',
    'concrete', 'reinforced concrete', 'prestressed concrete', 'steel',
    'structural steel', 'timber', 'masonry', 'building code',
    'moment', 'shear force', 'bending moment', 'deflection', 'buckling',
    'geotechnical engineering', 'soil mechanics', 'soil', 'bearing capacity',
    'settlement', 'slope stability', 'retaining wall', 'highway engineering',
    'transportation engineering', 'hydraulic engineering', 'water resources'
  ],

  'chemical engineering': [
    'chemical reactor', 'reactor design', 'reaction engineering', 'process',
    'unit operation', 'separation process', 'distillation', 'absorption',
    'extraction', 'crystallization', 'filtration', 'mass transfer',
    'heat transfer', 'heat exchanger', 'fluid mechanics', 'fluid flow',
    'pressure drop', 'pump', 'compressor', 'turbine', 'valve',
    'process control', 'feedback control', 'PID controller', 'instrumentation',
    'material balance', 'energy balance', 'thermodynamics', 'phase equilibrium',
    'chemical kinetics', 'catalyst', 'process optimization', 'process design',
    'process safety', 'scale-up', 'pilot plant'
  ]
};

/**
 * Get all keywords for a specific field
 * @param {string} field - The STEM field (mathematics, CS, physics, chemistry, biology, engineering)
 * @returns {string[]} Array of keywords, or empty array if field not found
 */
export function getFieldKeywords(field) {
  const normalizedField = field.toLowerCase().trim();
  return FIELD_KEYWORDS[normalizedField] || [];
}

/**
 * Get all available STEM fields
 * @returns {string[]} Array of field names
 */
export function getAllFields() {
  return Object.keys(FIELD_KEYWORDS);
}

/**
 * Check if a field exists in the database
 * @param {string} field - The STEM field to check
 * @returns {boolean} True if field exists
 */
export function hasField(field) {
  const normalizedField = field.toLowerCase().trim();
  return normalizedField in FIELD_KEYWORDS;
}
