import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { QrCodesService } from './qr-codes.service';
import { QrCodeEntity, QrType, QrCategory, QrStatus } from './qr-code.entity';
import { QrStaticContentEntity } from './qr-static-content.entity';
import { QrDynamicContentEntity } from './qr-dynamic-content.entity';

describe('QrCodesService', () => {
  let service: QrCodesService;
  let qrRepo: jest.Mocked<Repository<QrCodeEntity>>;
  let staticRepo: jest.Mocked<Repository<QrStaticContentEntity>>;
  let dynamicRepo: jest.Mocked<Repository<QrDynamicContentEntity>>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        QrCodesService,
        { provide: getRepositoryToken(QrCodeEntity), useValue: { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), find: jest.fn(), remove: jest.fn() } },
        { provide: getRepositoryToken(QrStaticContentEntity), useValue: { create: jest.fn() } },
        { provide: getRepositoryToken(QrDynamicContentEntity), useValue: { create: jest.fn(), findOne: jest.fn(), increment: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('http://localhost:3000') } },
      ],
    }).compile();

    service = moduleRef.get(QrCodesService);
    qrRepo = moduleRef.get(getRepositoryToken(QrCodeEntity));
    staticRepo = moduleRef.get(getRepositoryToken(QrStaticContentEntity));
    dynamicRepo = moduleRef.get(getRepositoryToken(QrDynamicContentEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEncodedContent', () => {
    it('should encode URL category correctly', () => {
      const qr = {
        type: QrType.STATIC,
        category: QrCategory.URL,
        staticContent: { content: { url: 'https://example.com' } },
        dynamicContent: null,
      } as unknown as QrCodeEntity;

      expect(service.getEncodedContent(qr)).toBe('https://example.com');
    });

    it('should encode WiFi category correctly', () => {
      const qr = {
        type: QrType.STATIC,
        category: QrCategory.WIFI,
        staticContent: { content: { ssid: 'MyWiFi', password: 'pass123', encryption: 'WPA' } },
        dynamicContent: null,
      } as unknown as QrCodeEntity;

      const result = service.getEncodedContent(qr);
      expect(result).toContain('WIFI:T:WPA;S:MyWiFi;P:pass123');
    });

    it('should encode dynamic QR as short URL', () => {
      const qr = {
        type: QrType.DYNAMIC,
        category: QrCategory.URL,
        staticContent: null,
        dynamicContent: { shortCode: 'abc123' },
      } as unknown as QrCodeEntity;

      const result = service.getEncodedContent(qr);
      expect(result).toBe('http://localhost:3000/r/abc123');
    });

    it('should encode email category correctly', () => {
      const qr = {
        type: QrType.STATIC,
        category: QrCategory.EMAIL,
        staticContent: { content: { email: 'test@test.com', subject: 'Hi', body: 'Hello' } },
        dynamicContent: null,
      } as unknown as QrCodeEntity;

      const result = service.getEncodedContent(qr);
      expect(result).toContain('mailto:test@test.com');
    });
  });
});
