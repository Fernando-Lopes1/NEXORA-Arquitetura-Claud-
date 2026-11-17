<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OrdemServicoController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('ordens.index');
});

Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

Route::prefix('ordens')->name('ordens.')->group(function () {
    Route::get('/', [OrdemServicoController::class, 'index'])->name('index');
    Route::post('/', [OrdemServicoController::class, 'store'])->name('store');
    Route::get('/{codigo}', [OrdemServicoController::class, 'show'])->name('show');
    Route::match(['post', 'patch'], '/{codigo}/atribuir', [OrdemServicoController::class, 'assignTecnico'])->name('atribuir');
    Route::match(['post', 'patch'], '/{codigo}/concluir', [OrdemServicoController::class, 'complete'])->name('concluir');
    Route::match(['post', 'patch'], '/{codigo}/cancelar', [OrdemServicoController::class, 'cancel'])->name('cancelar');
    Route::delete('/{codigo}', [OrdemServicoController::class, 'destroy'])->name('destroy');
});
