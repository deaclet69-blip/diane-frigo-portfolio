import { Test } from '@nestjs/testing';
import { StockService } from './stock.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

/**
 * Point de départ de la suite de tests (§23, Phase 5). Vérifie la règle
 * la plus critique de toute l'application : le calcul du stock actuel
 * (Entrées + Ajustements − Sorties), qui remplace le calcul en cascade
 * fragile de l'Excel. À compléter avec des tests sur SalesService
 * (transaction complète), InvoicesService.voidInvoice (réversion du stock)
 * et FinancesService.getRecoveryStatus (formule de récupération).
 */
describe('StockService', () => {
  let service: StockService;
  const groupByMock = jest.fn();

  const prismaMock = {
    stockMovement: { groupBy: groupByMock },
    product: { findMany: jest.fn().mockResolvedValue([]) },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(StockService);
  });

  it('calcule le stock actuel = Entrées + Ajustements − Sorties', async () => {
    groupByMock.mockResolvedValue([
      { movementType: 'ENTRY', _sum: { quantity: 1000 } },
      { movementType: 'EXIT', _sum: { quantity: 300 } },
      { movementType: 'INVENTORY_ADJUSTMENT', _sum: { quantity: 50 } },
    ]);

    // computeCurrentStock est privée : on passe par getOverview avec un
    // produit factice pour vérifier le résultat exposé publiquement.
    prismaMock.product.findMany.mockResolvedValueOnce([
      {
        id: 'p1', name: 'Test', category: null, unit: 'carton',
        alertThreshold: 500, referencePurchasePrice: 100, referenceSalePrice: 150, isActive: true,
      },
    ]);

    const overview = await service.getOverview();
    expect(overview.items[0].currentStock).toBe(1000 - 300 + 50); // = 750
  });

  it('renvoie 0 quand aucun mouvement n\'existe pour le produit', async () => {
    groupByMock.mockResolvedValue([]);
    prismaMock.product.findMany.mockResolvedValueOnce([
      {
        id: 'p2', name: 'Nouveau', category: null, unit: 'carton',
        alertThreshold: 500, referencePurchasePrice: 100, referenceSalePrice: 150, isActive: true,
      },
    ]);

    const overview = await service.getOverview();
    expect(overview.items[0].currentStock).toBe(0);
    expect(overview.items[0].status).toBe('RUPTURE');
  });
});
