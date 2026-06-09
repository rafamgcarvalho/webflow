#include <stdio.h>
#include <string.h>
#include <math.h>

/* Programa: Fatorial */
int main(void) {
    int n;
    int fat;
    int i;
    printf("Digite um número inteiro não-negativo:\n");
    scanf("%d", &n);
    if (n < 0) {
        printf("Entrada inválida (negativo).\n");
    } else {
        fat = 1;
        i = 1;
        while (i <= n) {
            fat = fat * i;
            i = i + 1;
        }
        printf("Fatorial = ");
        printf("%d\n", fat);
    }
    return 0;
}
