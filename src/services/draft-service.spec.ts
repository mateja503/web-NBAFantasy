import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DraftRequest, DraftService, DraftTeamsResponse } from './draft-service';
import { TEST_API_BASE_URL, provideConfigStub } from '../testing/test-helpers';
import { makeTeam } from '../testing/fixtures';

describe('DraftService', () => {
  let service: DraftService;
  let httpMock: HttpTestingController;

  const draftUrl = `${TEST_API_BASE_URL}/v1/draft`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideConfigStub()],
    });
    service = TestBed.inject(DraftService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  describe('startDraft', () => {
    it('POSTs the draft request', () => {
      const payload: DraftRequest = { leagueId: 9, startDraft: true };

      service.startDraft(payload).subscribe();

      const req = httpMock.expectOne(`${draftUrl}/start-draft`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({});
    });

    it('POSTs an empty body when no fields are supplied', () => {
      service.startDraft({}).subscribe();

      const req = httpMock.expectOne(`${draftUrl}/start-draft`);
      expect(req.request.body).toEqual({});
      req.flush({});
    });

    it('surfaces a rejection when the draft cannot start', () => {
      let status: number | undefined;

      service.startDraft({ leagueId: 9 }).subscribe({ error: (e) => (status = e.status) });

      httpMock
        .expectOne(`${draftUrl}/start-draft`)
        .flush('league not full', { status: 409, statusText: 'Conflict' });

      expect(status).toBe(409);
    });
  });

  describe('endDraft', () => {
    it('POSTs to the end-draft endpoint', () => {
      const payload: DraftRequest = { leagueId: 9 };

      service.endDraft(payload).subscribe();

      const req = httpMock.expectOne(`${draftUrl}/end-draft`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({});
    });
  });

  describe('getDraftTeams', () => {
    it('GETs the draft order for a league', () => {
      const expected: DraftTeamsResponse = { round: 3, teams: [makeTeam({ teamid: 3 })] };
      let received: DraftTeamsResponse | undefined;

      service.getDraftTeams(9).subscribe((r) => (received = r));

      const req = httpMock.expectOne(`${draftUrl}/get-draft-teams/9`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      expect(received?.round).toBe(3);
      expect(received?.teams).toHaveLength(1);
    });

    it('surfaces a 404 for a league with no draft', () => {
      let status: number | undefined;

      service.getDraftTeams(404).subscribe({ error: (e) => (status = e.status) });

      httpMock
        .expectOne(`${draftUrl}/get-draft-teams/404`)
        .flush('no draft', { status: 404, statusText: 'Not Found' });

      expect(status).toBe(404);
    });
  });
});
