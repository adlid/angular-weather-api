import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, throwError, of, BehaviorSubject } from 'rxjs';
import { map, mergeMap, switchMap, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserModel } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  isLoggedIn = new BehaviorSubject(false);

  onLogin = new Subject<any>();
  onLogout = new Subject<any>();

  private token: string = null;
  private userData: UserModel = null;

  constructor(
    private http: HttpClient,
  ) {

    this.resolveToken();
  }

  validateTokenOnServer() {
    return this.http.get(environment['apiBaseUrl'] + '/api/auth/validate-token')
      .pipe(
        map(data => {
          return data['user'] ? data['user'] : false;
        }
        ),
        tap((status) => { if (status) { this.userData = status['user']; } }),
        tap((status) => { if (!status) { this.isLoggedIn.next(false); } }),
        catchError(err => {
          return of(false);
        }),
      );
  }
  resolveToken(): boolean {
    this.token = localStorage.getItem('token');
    this.isLoggedIn.next(this.token ? true : false);
    return this.token ? true : false;
  }

  getToken(): string {
    return this.token;
  }

  hasToken(): boolean {
    return this.getToken() ? true : false;
  }

  async logout() {
    return this.http.get(environment['apiBaseUrl'] + '/api/auth/logout').toPromise().then(
      () => {

        this.clearData();

        this.isLoggedIn.next(false);
        return true;
      },
      (err) => {
        return false;
      }
    );
  }

  async login({ username, password }): Promise<any> {

    this.clearData();


    const loginData = {
      'username': username,
      'password': password
    };

    const data = await this.http.post(environment['apiBaseUrl'] + '/api/auth/login', loginData).toPromise();

    if (data['token'] && data['user']) {

      this.setDataAfterLogin(data);
      this.isLoggedIn.next(true);

      return data['user'];
    } else {
      return false;
    }
  }

  clearData() {
    this.userData = null;
    this.token = null;
    localStorage.clear();
  }

  getUserData(): UserModel {
    return this.userData;
  }

  private setDataAfterLogin(data) {
    this.token = data['token'];


    this.userData = data['user'];


    localStorage.setItem('token', this.token);
    localStorage.setItem('usermeta', JSON.stringify(this.userData));
  }
}
