import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  it('throws when apiBaseUrl is read before load() resolves', () => {
    expect(() => service.apiBaseUrl).toThrowError(/read before config was loaded/);
  });

  it('fetches /config.json and exposes apiBaseUrl', async () => {
    const loaded = service.load();

    const req = httpMock.expectOne('/config.json');
    expect(req.request.method).toBe('GET');
    req.flush({ apiBaseUrl: 'https://api.example.test' });

    await loaded;
    expect(service.apiBaseUrl).toBe('https://api.example.test');
  });

  it('rejects when the config fetch fails, leaving apiBaseUrl unreadable', async () => {
    const loaded = service.load();

    httpMock
      .expectOne('/config.json')
      .flush('nope', { status: 500, statusText: 'Server Error' });

    await expect(loaded).rejects.toBeTruthy();
    // A failed load must NOT leave a half-initialised service reporting a bogus URL.
    expect(() => service.apiBaseUrl).toThrowError(/read before config was loaded/);
  });

  it('keeps an empty apiBaseUrl if the server sends one, rather than throwing', async () => {
    // Guards against a "falsy means unloaded" regression: an empty string is a
    // loaded-but-misconfigured deployment, which is a different failure than "not loaded".
    const loaded = service.load();
    httpMock.expectOne('/config.json').flush({ apiBaseUrl: '' });

    await loaded;
    expect(service.apiBaseUrl).toBe('');
  });
});
